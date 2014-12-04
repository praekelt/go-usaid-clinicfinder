var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;


describe("app", function() {
    describe("GoApp", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoApp();

            tester = new AppTester(app);

            tester
                .setup.config.app({
                    name: 'test_app'
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when the user starts a session", function() {
            it("should ask for type of clinic", function() {
                return tester
                    .inputs(
                        {session_event: "new"}
                    )
                    .check.interaction({
                        state: 'state_clinic_type',
                        reply: [
                            "Welcome to Clinic Finder. What type of clinic " +
                            "are you looking for?",
                            "1. Nearest Clinic",
                            "2. MMC Clinic",
                            "3. HCT Clinic"
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user selects a clinic type", function() {
            it("should ask for type of sim card", function() {
                return tester
                    .inputs(
                        {session_event: "new"},
                        '1'  // state_clinic_type
                    )
                    .check.interaction({
                        state: 'state_sim_type',
                        reply: [
                            "To find ur closest clinic we need to know " +
                            "what SIM you have in ur phone:",
                            "1. Vodacom or MTN",
                            "2. Other",
                            "3. Quit"
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user selects a sim type", function() {
            describe("if the user selects 1. Vodacom or MTN", function() {
                it("should confirm locating them", function() {
                    return tester
                        .inputs(
                            {session_event: "new"},
                            '1',  // state_clinic_type
                            '1'  // state_sim_type
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
                    it("should display clinic names", function() {
                        return tester
                            .inputs(
                                {session_event: "new"},
                                '1',  // state_clinic_type
                                '1',  // state_sim_type
                                '1'  // state_locate_permission
                            )
                            .check.interaction({
                                state: 'state_clinic_names',
                                reply:
                                    "Clinic 1, Clinic 2"
                            })
                            .run();
                    });
                });

                describe("if the user chooses 2. No don't locate", function() {
                    it("should reprompt for location consent", function() {
                        return tester
                            .inputs(
                                {session_event: "new"},
                                '1',  // state_clinic_type
                                '1',  // state_sim_type
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
                        it("should show 2 clinic names", function() {
                            return tester
                            .inputs(
                                {session_event: "new"},
                                '1',  // state_clinic_type
                                '1',  // state_sim_type
                                '2',  // state_locate_permission
                                '1'  // state_reprompt_permission
                            )
                            .check.interaction({
                                state: 'state_clinic_names',
                                reply:
                                    "Clinic 1, Clinic 2"
                            })
                            .run();
                        });
                    });

                    describe("if they choose 2. Give suburb", function() {
                        it("should prompt for their suburb", function() {
                            return tester
                            .inputs(
                                {session_event: "new"},
                                '1',  // state_clinic_type
                                '1',  // state_sim_type
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
                                '1',  // state_clinic_type
                                '1',  // state_sim_type
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

            describe("if the user selects 2. Other", function() {
                it("should ask for their suburb", function() {
                    return tester
                        .inputs(
                            {session_event: "new"},
                            '1',  // state_clinic_type
                            '2'  // state_sim_type
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
                    it("should display two closest clinics", function() {
                        return tester
                            .inputs(
                                {session_event: "new"},
                                '1',  // state_clinic_type
                                '2',  // state_sim_type
                                'Observatory'  // state_suburb
                            )
                            .check.interaction({
                                state: 'state_clinic_names',
                                reply:
                                    "Clinic 1, Clinic 2"
                            })
                            .check.reply.ends_session()
                            .run();
                    });
                });
            });

            describe("if the user selects 3. Quit", function() {
                it("should show info and end", function() {
                    return tester
                        .inputs(
                            {session_event: "new"},
                            '1',  // state_clinic_type
                            '3'  // state_sim_type
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

        // describe("when the user asks to see the menu again", function() {
        //     it("should show the menu again", function() {
        //         return tester
        //             .setup.user.state('states:start')
        //             .input('1')
        //             .check.interaction({
        //                 state: 'states:start',
        //                 reply: [
        //                     'Hi there! What do you want to do?',
        //                     '1. Show this menu again',
        //                     '2. Exit'
        //                 ].join('\n')
        //             })
        //             .run();
        //     });
        // });

        // describe("when the user asks to exit", function() {
        //     it("should say thank you and end the session", function() {
        //         return tester
        //             .setup.user.state('states:start')
        //             .input('2')
        //             .check.interaction({
        //                 state: 'states:end',
        //                 reply: 'Thanks, cheers!'
        //             })
        //             .check.reply.ends_session()
        //             .run();
        //     });
        // });
    });
});
