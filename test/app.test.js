var vumigo = require('vumigo_v02');
var AppTester = vumigo.AppTester;
var LocationState = require('go-jsbox-location');
var assert = require('assert');


describe("app", function() {
    describe("GoApp", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoApp();
            tester = new AppTester(app);
            locations = LocationState.testing();

            locations.add_location({
                request:"Friend Street",
                response_data: {
                    results: [
                        {
                            formatted_address:"Friend Street, Suburb",
                            geometry: {
                                location: {lng: '3.1415', lat: '2.7182'}
                            }
                        }
                    ],
                    status:"OK"
                }
            });

            locations.add_location({
                request:"Quad Street",
                response_data: {
                    results: [
                        {
                            formatted_address:"Quad St 1, Sub 1",
                            geometry: {
                                location: { lng: '1.1', lat: '1.11' }
                            }
                        },{
                            formatted_address:"Quad St 2, Sub 2",
                            geometry: {
                                location: { lng: '2.2', lat: '2.22' }
                            }
                        },{
                            formatted_address:"Quad St 3, Sub 3",
                            geometry: {
                                location: { lng: '3.3', lat: '3.33' }
                            }
                        },{
                            formatted_address:"Quad St 4, Sub 4",
                            geometry: {
                                location: { lng: '4.4', lat: '4.44' }
                            }
                        }
                    ],
                    status:"OK"
                }
            });

            tester
                .setup.config.app({
                    name: 'test_app',
                    welcome_enabled: false,
                    sms_number: '555',
                    lbs_providers: ['VODACOM', 'MTN']
                })
                .setup(function(api) {
                    locations.fixtures.forEach(api.http.fixtures.add);
                });
        });

        describe("when the user starts a session", function() {
            describe("when a welcome screen is not enabled", function() {
                it("should ask for type of clinic", function() {
                    return tester
                        .inputs(
                            {session_event: "new"}
                        )
                        .check.interaction({
                            state: 'state_clinic_type',
                            reply: [
                                "Welcome to Clinic Finder. What type of " +
                                "clinic are you looking for?",
                                "1. Nearest Clinic",
                                "2. MMC Clinic",
                                "3. HCT Clinic"
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when a welcome screen is enabled", function() {
                it("should welcome them", function() {
                    return tester
                        .setup.config.app({
                            welcome_enabled: true
                        })
                        .inputs(
                            {session_event: "new"}
                        )
                        .check.interaction({
                            state: 'state_welcome',
                            reply: [
                                "Welcome to Brothers for Life!",
                                "1. Find ur closest MMC clinic",
                                "2. Sign up for MMC post-op SMSs to help " +
                                "you heal",
                            ].join('\n')
                        })
                        .run();
                });
            });
        });

        describe("when the user responds to the welcome screen", function() {
            describe("if they choose to locate a clinic", function() {
                it("should ask for type of clinic", function() {
                    return tester
                        .setup.config.app({
                            welcome_enabled: true
                        })
                        .inputs(
                            {session_event: "new"},
                            '1'  // state_welcome
                        )
                        .check.interaction({
                            state: 'state_clinic_type',
                            reply: [
                                "Welcome to Clinic Finder. What type of " +
                                "clinic are you looking for?",
                                "1. Nearest Clinic",
                                "2. MMC Clinic",
                                "3. HCT Clinic"
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if they choose to sign up for messages", function() {
                it("should provide info on how to subscribe", function() {
                    return tester
                        .setup.config.app({
                            welcome_enabled: true
                        })
                        .inputs(
                            {session_event: "new"},
                            '2'  // state_welcome
                        )
                        .check.interaction({
                            state: 'state_how_to_register',
                            reply:
                                "Welcome to the Medical Male Circumcision " +
                                "(MMC) info service. To get FREE info on how " +
                                "to look after your circumcision wound " +
                                "please SMS 'MMC' to 555.",
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        describe("when the user selects a clinic type", function() {
            describe("if the user uses a provider that provides location " +
            "based search", function() {
                it("should confirm locating them", function() {
                    return tester
                        .inputs(
                            {session_event: "new"},
                            { content: '1',
                              provider: 'MTN' }  // state_clinic_type
                        )
                        .check.interaction({
                            state: 'state_locate_permission',
                            reply: [
                                "Thanks! We will now locate your approximate " +
                                "position and then send you an SMS with your " +
                                "nearest clinic.",
                                "1. Continue",
                                "2. No don't locate me"
                            ].join('\n')
                        })
                        .run();
                });

                describe("if the user chooses 1. Continue", function() {
                    it("should ask about health services opt-in", function() {
                        return tester
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '1'  // state_locate_permission
                            )
                            .check.interaction({
                                state: 'state_health_services',
                                reply: [
                                    "You will get an SMS with the clinic " +
                                    "info shortly. Want to hear about the " +
                                    "latest health services & info? T&Cs " +
                                    "www.zazi.org.za",
                                    "1. For female",
                                    "2. For males",
                                    "3. No"
                                ].join("\n")
                            })
                            .run();
                    });
                });

                describe("if the user chooses 2. No don't locate", function() {
                    it("should reprompt for location consent", function() {
                        return tester
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '2'  // state_locate_permission
                            )
                            .check.interaction({
                                state: 'state_reprompt_permission',
                                reply: [
                                    "If you do not give consent we can't locate you " +
                                    "automatically. Alternatively, give us your " +
                                    "suburb:",
                                    "1. Give consent",
                                    "2. Give suburb",
                                    "3. Quit"
                                ].join('\n')
                            })
                            .run();
                    });
                });

                describe("if the user replies after initially refusing consent", function() {

                    describe("if they choose 1. Give consent", function() {
                        it("should ask about health services opt-in", function() {
                            return tester
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '2',  // state_locate_permission
                                '1'  // state_reprompt_permission
                            )
                            .check.interaction({
                                state: 'state_health_services',
                                reply: [
                                    "You will get an SMS with the clinic " +
                                    "info shortly. Want to hear about the " +
                                    "latest health services & info? T&Cs " +
                                    "www.zazi.org.za",
                                    "1. For female",
                                    "2. For males",
                                    "3. No"
                                ].join("\n")
                            })
                            .run();
                        });
                    });

                    describe("if they choose 2. Give suburb", function() {
                        it("should prompt for their suburb", function() {
                            return tester
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '2',  // state_locate_permission
                                '2'  // state_reprompt_permission
                            )
                            .check.interaction({
                                state: 'state_suburb',
                                reply:
                                    "To find your closest clinic we need to know " +
                                    "what suburb or area u are in. Please be " +
                                    "specific. e.g. Inanda Sandton"
                            })
                            .run();
                        });
                    });

                    describe("if they choose 3. Quit", function() {
                        it("should show info and quit", function() {
                            return tester
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '2',  // state_locate_permission
                                '3'  // state_reprompt_permission
                            )
                            .check.interaction({
                                state: 'state_quit',
                                reply:
                                    "Thanks for using Clinic Finder. For info on " +
                                    "MMC visit brothersforlife.org. For info on " +
                                    "HCT visit zazi.org.za. Find a clinic on the " +
                                    "web visit healthsites.org.za"
                            })
                            .check.reply.ends_session()
                            .run();
                        });
                    });

                });
            });

            describe("if the user does not use a provider that provides " +
            "location based search", function() {
                it("should ask for their suburb", function() {
                    return tester
                        .inputs(
                            {session_event: "new"},
                            { content: '1',
                              provider: 'CellC' }  // state_clinic_type
                        )
                        .check.interaction({
                            state: 'state_suburb',
                            reply:
                                "To find your closest clinic we need to know " +
                                "what suburb or area u are in. Please be " +
                                "specific. e.g. Inanda Sandton"
                        })
                        .run();
                });

                describe("after entering their suburb", function() {
                    describe("if there is only one location option", function() {
                        it("should ask about health services opt-in", function() {
                            return tester
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Friend Street'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_health_services',
                                    reply: [
                                        "You will get an SMS with the clinic " +
                                        "info shortly. Want to hear about the " +
                                        "latest health services & info? T&Cs " +
                                        "www.zazi.org.za",
                                        "1. For female",
                                        "2. For males",
                                        "3. No"
                                    ].join("\n")
                                })
                                .run();
                        });

                        it("should save location data to contact", function() {
                            return tester
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Friend Street'  // state_suburb
                                )
                                .check(function(api) {
                                    var contact = api.contacts.store[0];
                                    assert.equal(contact.extra[
                                        'location:formatted_address'],
                                        'Friend Street, Suburb');
                                    assert.equal(contact.extra[
                                        'location:geometry:location:lng'],
                                        '3.1415');
                                    assert.equal(contact.extra[
                                        'location:geometry:location:lat'],
                                        '2.7182');
                                })
                                .run();
                        });

                    describe("if there are multiple location options", function() {
                        it("should display a list of address options", function() {
                            return tester
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Quad Street'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_suburb',
                                    reply: [
                                        "Please select your location:",
                                        "1. Quad St 1, Sub 1",
                                        "2. Quad St 2, Sub 2",
                                        "3. Quad St 3, Sub 3",
                                        "4. Quad St 4, Sub 4",
                                        "n. Next",
                                        "p. Previous"
                                    ].join('\n')
                                })
                                .run();
                        });

                        it("should save data to contact upon choice", function() {
                            return tester
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Quad Street',  // state_suburb
                                    '3'  // state_suburb
                                )
                                .check(function(api) {
                                    var contact = api.contacts.store[0];
                                    assert.equal(contact.extra[
                                        'location:formatted_address'],
                                        'Quad St 3, Sub 3');
                                    assert.equal(contact.extra[
                                        'location:geometry:location:lng'],
                                        '3.3');
                                    assert.equal(contact.extra[
                                        'location:geometry:location:lat'],
                                        '3.33');
                                })
                                .run();
                        });
                    });

                    });
                });
            });

        });

        describe("when the user responds to health service option", function() {
            it("should store option as extra, thank them and exit", function() {
                return tester
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street',  // state_suburb
                        '2'  // state_health_services
                    )
                    .check.interaction({
                        state: 'state_thanks',
                        reply:
                            "Thanks for using the Clinic Finder " +
                            "Service. Opt out at any stage by " +
                            "SMSing 'STOP' in reply to your " +
                            "clinic info message."
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.health_services, 'male');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

    });
});
