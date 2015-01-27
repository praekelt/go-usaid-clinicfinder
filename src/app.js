go.app = function() {
    var vumigo = require('vumigo_v02');
    var LocationState = require('go-jsbox-location');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var MetricsHelper = require('go-jsbox-metrics-helper');
    var Q = require('q');
    var EndState = vumigo.states.EndState;
    var JsonApi = vumigo.http.api.JsonApi;


    var GoApp = App.extend(function(self) {
        App.call(self, 'state_start');
        var $ = self.$;

        self.init = function() {
            // Use the metrics helper to add the required metrics
            mh = new MetricsHelper(self.im);
            mh
                // Total unique users
                .add.total_unique_users('sum.unique_users')

                // Total registrations
                .add.total_state_actions(
                    {
                        state: 'states_language',
                        action: 'enter'
                    },
                    'sum.registrations'
                )

                // Total opt outs
                .add.total_state_actions(
                    {
                        state: 'states_unsubscribe',
                        action: 'enter'
                    },
                    'sum.optouts'
                );

            // Configure URLs
            self.req_location_url = self.im.config.api_url + 'requestlocation/';
            self.req_lookup_url = self.im.config.api_url + 'requestlookup/';
            self.lbsrequest_url = self.im.config.api_url + 'lbsrequest/';

            self.http = new JsonApi(self.im, {
                headers: {
                    'Authorization': ['Token ' + self.im.config.api_key]
                }
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };


        self.make_clinic_search_params = function() {
            var clinic_type_requested = self.im.user.answers.state_clinic_type;
            var search_data = {};

            if (clinic_type_requested === "nearest") {
                self.im.config.clinic_types.forEach(function(clinic_type) {
                    search_data[clinic_type] = "true";
                });
            } else {
                search_data[clinic_type_requested] = "true";
            }
            return search_data;
        };

        self.make_location_data = function(contact) {
            var location_data = {
                point: {
                    type: "Point",
                    coordinates: [
                        contact.extra['location:geometry:location:lng'],
                        contact.extra['location:geometry:location:lat']
                    ]
                }
            };
            return location_data;
        };

        self.make_lookup_data = function(contact, location) {
            var lookup_data = {
                search: self.make_clinic_search_params(),
                response: {
                    template_type: "SMS",
                    to_addr: contact.msisdn,
                    template: "Your nearest clinic is {{ results }}. Thanks " +
                              "for using Clinic Finder"
                },
                location: location
            };
            return lookup_data;
        };

        self.make_lbs_data = function(contact, pointofinterest) {
            var lbs_data = {
                search: {
                    msisdn: contact.msisdn.replace(/[^0-9]/g, "")  // remove '+'
                },
                pointofinterest: pointofinterest
            };
            return lbs_data;
        };

        self.manual_locate = function(contact) {
            return Q.all([
                self.fire_database_query_metric(),
                self.http.post(self.req_lookup_url, {
                    data: self.make_lookup_data(contact,
                        self.make_location_data(contact))
                })
            ]);
        };

        self.lbs_locate = function(contact) {
            return Q.all([
                self.fire_database_query_metric(),
                self.http.post(self.lbsrequest_url, {
                    data: self.make_lbs_data(contact,
                        self.make_lookup_data(contact, null))
                })
            ]);
        };


        // METRIC HELPERS
        self.fire_clinic_type_metric = function(clinic_type_requested) {
            return self.im.metrics.fire.inc(
                ['sum.clinic_type_select', clinic_type_requested].join('.'), 1);
        };

        self.fire_database_query_metric = function() {
            var clinic_type_requested = self.im.user.answers.state_clinic_type;
            return self.im.metrics.fire.inc(
                ['sum.database_queries', clinic_type_requested].join('.'), 1);
        };

        self.fire_clinics_found_metric = function(clinics_found) {
            if (clinics_found === '1') {
                return self.im.metrics.fire.inc('sum.one_time_users', 1);
            } else {
                return Q.all([
                    self.im.metrics.fire.inc('sum.multiple_time_users', 1),
                    self.im.metrics.fire.inc('sum.one_time_users', {amount: -1})
                ]);
            }
        };


        // STATES
        self.states.add('state_start', function(name) {
            if (self.im.config.welcome_enabled) {
                return self.states.create('state_welcome');
            } else {
                return self.states.create('state_clinic_type');
            }
        });

        self.states.add('state_welcome', function(name) {
            return new ChoiceState(name, {
                question:
                    $("Welcome to Brothers for Life!"),
                choices: [
                    new Choice('clinic', $("Find ur closest MMC clinic")),
                    new Choice('register', $("Sign up for MMC post-op SMSs " +
                                            "to help you heal"))
                ],
                next: function(choice) {
                    switch (choice.value) {
                        case 'clinic': return 'state_clinic_type';
                        case 'register': return 'state_how_to_register';
                    }
                }
            });
        });

        self.states.add('state_how_to_register', function(name) {
            return new EndState(name, {
                text:
                    $("Welcome to the Medical Male Circumcision (MMC) info " +
                      "service. To get FREE info on how to look after your " +
                      "circumcision wound please SMS 'MMC' to {{SMS_number}}."
                    ).context({
                        SMS_number: self.im.config.sms_number
                    }),
                next: 'states_start'
            });
        });

        self.states.add('state_clinic_type', function(name) {
            return new ChoiceState(name, {
                question:
                    $("Welcome to Clinic Finder. What type of clinic " +
                      "are you looking for?"),

                choices: [
                    new Choice('nearest', $("Nearest Clinic")),
                    new Choice('mmc', $("MMC Clinic")),
                    new Choice('hct', $("HCT Clinic"))
                ],

                next: function(choice) {
                    return self
                        .fire_clinic_type_metric(choice.value)
                        .then(function() {
                            if (typeof self.im.msg.provider !== 'undefined' && self.im.msg.provider !== null) {
                                var service_provider = self.im.msg.provider.trim().toUpperCase();
                                if (self.im.config.lbs_providers.indexOf(service_provider) !== -1) {
                                    return 'state_locate_permission';
                                } else {
                                    return 'state_suburb';
                                }
                            } else {
                                // For transports that don't provide provider info
                                return 'state_suburb';
                            }

                        });


                }
            });
        });

        self.states.add('state_locate_permission', function(name) {
            return new ChoiceState(name, {
                question:
                    $("Thanks! We will now locate your approximate " +
                      "position and then send you an SMS with your " +
                      "nearest clinic."),

                choices: [
                    new Choice('locate', $("Continue")),
                    new Choice('no_locate', $("No don't locate me")),
                ],

                next: function(choice) {

                    switch (choice.value) {
                        case 'locate': return 'state_lbs_locate';
                        case 'no_locate': return 'state_reprompt_permission';
                    }
                }
            });
        });

        self.states.add('state_reprompt_permission', function(name) {
            return new ChoiceState(name, {
                question:
                    $("If you do not give consent we can't locate you " +
                      "automatically. Alternatively, give us your " +
                      "suburb:"),

                choices: [
                    new Choice('consent', $("Give consent")),
                    new Choice('suburb', $("Give suburb")),
                    new Choice('quit', $("Quit"))
                ],

                next: function(choice) {
                    switch (choice.value) {
                        case 'consent': return 'state_lbs_locate';
                        case 'suburb': return 'state_suburb';
                        case 'quit': return 'state_quit';
                    }
                }
            });
        });

        self.states.add('state_lbs_locate', function(name) {
            return self
                .lbs_locate(self.contact)
                .then(function() {
                    return self.states.create('state_health_services_enter');
                });
        });

        self.states.add('state_suburb', function(name) {
            return new LocationState(name, {
                question:
                    $("To find your closest clinic we need to know " +
                      "what suburb or area u are in. Please be " +
                      "specific. e.g. Inanda Sandton"),
                error_question:
                    $("Sorry there are no results for your location. " +
                      "Please re-enter your location again carefully " +
                      "and make sure you use the correct spelling."),
                refine_question:
                    $("Please select your location:"),
                store_fields: [
                    "formatted_address",
                    "geometry.location.lng",
                    "geometry.location.lat"
                ],
                next: 'state_locate_clinic'
            });
        });

        self.states.add('state_locate_clinic', function(name) {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    self.contact = user_contact;
                })
                .then(function() {
                    return self
                        .manual_locate(self.contact)
                        .then(function() {
                            return self.states.create(
                                'state_health_services_enter');
                        });
                });
        });

        self.states.add('state_health_services_enter', function(name) {
            if (self.contact.extra.clinics_found === undefined) {
                self.contact.extra.clinics_found = "1";
            } else {
                self.contact.extra.clinics_found = (parseInt(
                    self.contact.extra.clinics_found, 10) + 1).toString();
            }

            return Q
                .all([
                    self.im.contacts.save(self.contact),
                    self.fire_clinics_found_metric(
                        self.contact.extra.clinics_found)
                ])
                .then(function() {
                    return self.states.create('state_health_services');
                });
        });

        self.states.add('state_health_services', function(name) {
            return new ChoiceState(name, {
                question:
                    $("You will get an SMS with the clinic " +
                      "info shortly. Want to hear about the " +
                      "latest health services & info? T&Cs " +
                      "www.zazi.org.za"),

                choices: [
                    new Choice('female', $("For female")),
                    new Choice('male', $("For males")),
                    new Choice('deny', $("No"))
                ],

                next: function(choice) {
                    self.contact.extra.health_services = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return 'state_thanks';
                        });
                }
            });
        });

        self.states.add('state_thanks', function(name) {
            return new EndState(name, {
                text:
                    $("Thanks for using the Clinic Finder " +
                      "Service. Opt out at any stage by " +
                      "SMSing 'STOP' in reply to your " +
                      "clinic info message."),

                next: 'state_start'
            });
        });

        self.states.add('state_quit', function(name) {
            return new EndState(name, {
                text:
                    $("Thanks for using Clinic Finder. For info on " +
                      "MMC visit brothersforlife.org. For info on " +
                      "HCT visit zazi.org.za. Find a clinic on the " +
                      "web visit healthsites.org.za"),

                next: 'state_start'
            });
        });
    });

    return {
        GoApp: GoApp
    };
}();
