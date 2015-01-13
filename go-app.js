// WARNING: This is a generated file.
//          If you edit it you will be sad.
//          Edit src/app.js instead.

var go = {};
go;

go.app = function() {
    var vumigo = require('vumigo_v02');
    var LocationState = require('go-jsbox-location');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var JsonApi = vumigo.http.api.JsonApi;


    var GoApp = App.extend(function(self) {
        App.call(self, 'state_start');
        var $ = self.$;

        self.init = function() {
            self.http = new JsonApi(self.im);

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

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

                next: 'state_sim_type'
            });
        });

        self.states.add('state_sim_type', function(name) {
            return new ChoiceState(name, {
                question:
                    $("To find ur closest clinic we need to know " +
                      "what SIM you have in ur phone:"),

                choices: [
                    new Choice('vodacom_mtn', $("Vodacom or MTN")),
                    new Choice('other', $("Other")),
                    new Choice('quit', $("Quit"))
                ],

                next: function(choice) {
                    switch (choice.value) {
                        case 'vodacom_mtn': return 'state_locate_permission';
                        case 'other': return 'state_suburb';
                        case 'quit': return 'state_quit';
                    }
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
                        case 'locate': return 'state_health_services';  // pending - change to state_send_location
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
                        case 'consent': return 'state_health_services';  // pending - change to state_send_location
                        case 'suburb': return 'state_suburb';
                        case 'quit': return 'state_quit';
                    }
                }
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
                next: 'state_health_services'  // pending - change to state_send_location
            });
        });

        self.states.add('state_send_location', function(name) {
            return self.http
                .post(target, coordinates, clinic_type, template_text)
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

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoApp = go.app.GoApp;


    return {
        im: new InteractionMachine(api, new GoApp())
    };
}();
