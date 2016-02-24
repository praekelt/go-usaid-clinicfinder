var vumigo = require('vumigo_v02');
var AppTester = vumigo.AppTester;
var _ = require('lodash');
var fixtures = require('./fixtures');
var location = require('go-jsbox-location');
var openstreetmap = location.providers.openstreetmap;
var assert = require('assert');


describe("app", function() {
    describe("GoApp", function() {
        var app;
        var tester;
        var locations;

        beforeEach(function() {
            app = new go.app.GoApp();
            tester = new AppTester(app);
            locations = [];

            locations.push({
                query: "Quad Street",
                bounding_box: ["16.4500", "-22.1278", "32.8917", "-34.8333"],
                address_limit: 4,
                response_data: [
                    {
                        display_name:"Quad St 1, Sub 1",
                        lon: '1.1',
                        lat: '1.11',
                        address: {
                            road: "Quad St 1",
                            suburb: "Suburb number 1",
                            city: "City number 1",
                            town: "Town 1",
                            postcode: "0001",
                            country: "RSA",
                            country_code: "za"
                        }
                    },{
                        display_name:"Quad St 2, Sub 2",
                        lon: '2.2',
                        lat: '2.22',
                        address: {
                            road: "Quad St 2",
                            suburb: "Suburb number 2",
                            town: "Town number 2",
                            postcode: "0002",
                            country: "RSA",
                            country_code: "za"
                        }
                    },{
                        display_name:"Quad St 3, Sub 3",
                        lon: '3.3',
                        lat: '3.33',
                        address: {
                            road: "Quad St 3",
                            suburb: "Suburb number 3",
                            city: "City number 3",
                            postcode: "0003",
                            country: "RSA",
                            country_code: "za"
                        }
                    },{
                        display_name:"Quad St 4, Sub 4",
                        lon: '4.4',
                        lat: '4.44',
                        address: {
                            road: "Quad St 4",
                            suburb: "Suburb number 4",
                            postcode: "0004",
                            country: "RSA",
                            country_code: "za"
                        }
                    }
                ]
            });

            locations.push({
                query: "Friend Street",
                bounding_box: ["16.4500", "-22.1278", "32.8917", "-34.8333"],
                address_limit: 4,
                response_data: [
                    {
                        display_name: "Friend Street, Suburb",
                        lon: '3.1415',
                        lat: '2.7182'
                    }
                ]
            });

            tester
                .setup.config.app({
                    name: 'test_app',
                    welcome_enabled: false,
                    sms_number: '555',
                    lbs_providers: ['VODACOM', 'MTN'],
                    api_url: 'http://127.0.0.1:8000/clinicfinder/',
                    api_key: 'replace_with_token',
                    metric_store: 'usaid_clinicfinder_test',
                    template: "Your nearest clinics are: {{ results }}. " +
                              "Thanks for using Healthsites.",
                    osm: {
                      api_key: "osm_api_key",
                    },
                })
                .setup.char_limit(160)
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+082111',
                        extra: {},
                    });
                })
                .setup(function(api) {
                    api.metrics.stores = {'usaid_clinicfinder_test': {}};
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                    locations.forEach(function(location) {
                        api.http.fixtures.add(openstreetmap.fixture(location));
                    });
                });
        });

        describe("when the user starts a session", function() {
            it("should increase the number of unique users metric", function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"}
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.unique_users'].values, [1]);
                    })
                    .run();
            });

            describe("when a welcome screen is not enabled", function() {
                it("should ask for type of clinic", function() {
                    return tester
                        .setup.user.addr('082111')
                        .inputs(
                            {session_event: "new"}
                        )
                        .check.interaction({
                            state: 'state_clinic_type',
                            reply: [
                                "Welcome to Healthsites. What type of " +
                                "clinic are you looking for?",
                                "1. Circumcision",
                                "2. HIV Support"
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when a welcome screen is enabled", function() {
                it("should welcome them", function() {
                    return tester
                        .setup.user.addr('082111')
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
                        .setup.user.addr('082111')
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
                                "Welcome to Healthsites. What type of " +
                                "clinic are you looking for?",
                                "1. Circumcision",
                                "2. HIV Support"
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if they choose to sign up for messages", function() {
                it("should provide info on how to subscribe", function() {
                    return tester
                        .setup.user.addr('082111')
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
            it("should incr the clinic_type metric", function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'MTN' }  // state_clinic_type
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.clinic_type_select.mmc'].values, [1]);
                    })
                    .run();
            });

            describe("if the user uses a provider that provides location " +
            "based search", function() {
                it("should confirm locating them", function() {
                    return tester
                        .setup.user.addr('082111')
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
                    it("should increase the sum.database_queries metric", function() {
                        return tester
                            .setup.user.addr('082111')
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '1'  // state_locate_permission
                            )
                            .check(function(api) {
                                var metrics = api.metrics.stores.usaid_clinicfinder_test;
                                assert.deepEqual(metrics['sum.database_queries.mmc'].values, [1]);
                            })
                            .run();
                    });

                    it("should ask about health services opt-in", function() {
                        return tester
                            .setup.user.addr('082111')
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '1'  // state_locate_permission
                            )
                            .check.interaction({
                                state: 'state_health_services',
                                reply: [
                                    "U will get an SMS with clinic info. " +
                                    "Want 2 get more health info? T&Cs " +
                                    "www.brothersforlife.mobi " +
                                    "or www.zazi.org.za",
                                    "1. Yes - I'm a Man",
                                    "2. Yes - I'm a Woman",
                                    "3. No"
                                ].join("\n")
                            })
                            .run();
                    });

                    describe("if a custom clinic source is configured",
                    function () {
                        it("should specify the clinic source in the search request",
                        function() {
                            return tester
                                .setup.user.addr('082111')
                                .setup.config.app({clinic_data_source: "aat"})
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'MTN' },  // state_clinic_type
                                    '1'  // state_locate_permission
                                )
                                .check.interaction({
                                    state: 'state_health_services',
                                    reply: [
                                        "U will get an SMS with clinic info. " +
                                        "Want 2 get more health info? T&Cs " +
                                        "www.brothersforlife.mobi " +
                                        "or www.zazi.org.za",
                                        "1. Yes - I'm a Man",
                                        "2. Yes - I'm a Woman",
                                        "3. No"
                                    ].join("\n")
                                })
                                .check(function (api) {
                                    var search_request = api.http.requests[0];
                                    assert.deepEqual(
                                        search_request.data
                                            .pointofinterest.search, {
                                                "source": "aat",
                                                "mmc": "true",
                                            });
                                })
                                .run();
                        });
                    });
                });

                describe("if the user chooses 2. No don't locate", function() {
                    it("should reprompt for location consent", function() {
                        return tester
                            .setup.user.addr('082111')
                            .inputs(
                                {session_event: "new"},
                                { content: '1',
                                  provider: 'MTN' },  // state_clinic_type
                                '2'  // state_locate_permission
                            )
                            .check.interaction({
                                state: 'state_reprompt_permission',
                                reply: [
                                    "If you do not give consent we can't locate you automatically. " +
                                    "Alternatively, tell us where you live, " +
                                    "(area or suburb)",
                                    "1. Give consent",
                                    "2. Enter location",
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
                            .setup.user.addr('082111')
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
                                    "U will get an SMS with clinic info. " +
                                    "Want 2 get more health info? T&Cs " +
                                    "www.brothersforlife.mobi " +
                                    "or www.zazi.org.za",
                                    "1. Yes - I'm a Man",
                                    "2. Yes - I'm a Woman",
                                    "3. No"
                                ].join("\n")
                            })
                            .run();
                        });
                    });

                    describe("if they choose 2. Give suburb", function() {
                        it("should prompt for their suburb", function() {
                            return tester
                            .setup.user.addr('082111')
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
                                    "To find your closest clinic we need to know where you live, " +
                                    "the suburb or area u are in. Please be " +
                                    "specific. e.g. Inanda Sandton"
                            })
                            .run();
                        });
                    });

                    describe("if they choose 2. and give suburb", function() {
                        it("should ask about health services opt-in", function() {
                            return tester
                            .setup.user.addr('082111')
                            .inputs(
                                {session_event: "new"},
                                {content: '1', provider: 'MTN' }, // state_clinic_type
                                {content: '2', provider: 'MTN' },  // state_locate_permission
                                {content: '2', provider: 'MTN' },  // state_reprompt_permission
                                {content: 'Friend Street', provider: 'MTN' }  // state_suburb
                                )
                            .check.interaction({
                                state: 'state_health_services',
                                reply: [
                                    "U will get an SMS with clinic info. " +
                                    "Want 2 get more health info? T&Cs " +
                                    "www.brothersforlife.mobi " +
                                    "or www.zazi.org.za",
                                    "1. Yes - I'm a Man",
                                    "2. Yes - I'm a Woman",
                                    "3. No"
                                ].join("\n")
                            })
                            .run();
                        });
                    });

                    describe("if they choose 3. Quit", function() {
                        it("should show info and quit", function() {
                            return tester
                            .setup.user.addr('082111')
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
                                    "Thanks for using Healthsites. For info on " +
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

            describe("if the user on transport that does not have provider for " +
            "location based search", function() {
                it("should ask for their suburb", function() {
                    return tester
                        .setup.user.addr('082111')
                        .inputs(
                            {session_event: "new"},
                            { content: '1' }  // state_clinic_type
                        )
                        .check.interaction({
                            state: 'state_suburb',
                            reply:
                                "To find your closest clinic we need to know where you live, " +
                                "the suburb or area u are in. Please be " +
                                "specific. e.g. Inanda Sandton"
                        })
                        .run();
                });
            });

            describe("if the user does not use a provider that provides " +
            "location based search", function() {
                it("should ask for their suburb", function() {
                    return tester
                        .setup.user.addr('082111')
                        .inputs(
                            {session_event: "new"},
                            { content: '1',
                              provider: 'CellC' }  // state_clinic_type
                        )
                        .check.interaction({
                            state: 'state_suburb',
                            reply:
                                "To find your closest clinic we need to know where you live, " +
                                "the suburb or area u are in. Please be " +
                                "specific. e.g. Inanda Sandton"
                        })
                        .run();
                });

                describe("after entering their suburb", function() {
                    describe("if there is only one location option", function() {
                        it("should ask about health services opt-in", function() {
                            return tester
                                .setup.user.addr('082111')
                                .inputs(
                                    {session_event: "new"},
                                    { content: '2',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Friend Street'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_health_services',
                                    reply: [
                                        "U will get an SMS with clinic info. " +
                                        "Want 2 get more health info? T&Cs " +
                                        "www.brothersforlife.mobi " +
                                        "or www.zazi.org.za",
                                        "1. Yes - I'm a Man",
                                        "2. Yes - I'm a Woman",
                                        "3. No"
                                    ].join("\n")
                                })
                                .run();
                        });

                        it("should save location data to contact", function() {
                            return tester
                                .setup.user.addr('082111')
                                .inputs(
                                    {session_event: "new"},
                                    { content: '2',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Friend Street'  // state_suburb
                                )
                                .check(function(api) {
                                    var contact = _.find(api.contacts.store, {
                                                        msisdn: '+082111'
                                                    });
                                    assert.equal(contact.extra[
                                        'location:formatted_address'],
                                        'Friend Street, Suburb');
                                    assert.equal(contact.extra[
                                        'location:lon'], '3.1415');
                                    assert.equal(contact.extra[
                                        'location:lat'], '2.7182');
                                })
                                .run();
                        });

                    describe("if a custom clinic source is configured",
                    function () {
                        it("should specify the clinic source in the search request",
                        function() {
                            return tester
                                .setup.user.addr('082111')
                                .setup.config.app({clinic_data_source: "aat"})
                                .inputs(
                                    {session_event: "new"},
                                    { content: '2',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Friend Street'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_health_services',
                                    reply: [
                                        "U will get an SMS with clinic info. " +
                                        "Want 2 get more health info? T&Cs " +
                                        "www.brothersforlife.mobi " +
                                        "or www.zazi.org.za",
                                        "1. Yes - I'm a Man",
                                        "2. Yes - I'm a Woman",
                                        "3. No"
                                    ].join("\n")
                                })
                                .check(function (api) {
                                    var search_request = api.http.requests[1];
                                    assert.deepEqual(search_request.data.search, {
                                        "source": "aat",
                                        "hct": "true",
                                    });
                                })
                                .run();
                        });
                    });

                    describe("if there are multiple location options", function() {
                        it("should display a list of address options", function() {
                            return tester
                                .setup.user.addr('082111')
                                .inputs(
                                    {session_event: "new"},
                                    { content: '2',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Quad Street'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_suburb',
                                    reply: [
                                        "Please select your location:",
                                        "1. Suburb number 1, City number 1",
                                        "2. Suburb number 2, Town number 2",
                                        "3. Suburb number 3, City number 3",
                                        "n. More",
                                        "p. Back"
                                    ].join('\n')
                                })
                                .run();
                        });

                        it("should go the next page if 'n' is chosen", function() {
                            return tester
                                .setup.user.addr('082111')
                                .inputs(
                                    {session_event: "new"},
                                    { content: '2',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Quad Street',  // state_suburb
                                    'n'  // state_suburb
                                )
                                .check.interaction({
                                    state: 'state_suburb',
                                    reply: [
                                        "Please select your location:",
                                        "1. Suburb number 4",
                                        "n. More",
                                        "p. Back"
                                    ].join('\n')
                                })
                                .run();
                        });

                        it("should save data to contact upon choice", function() {
                            return tester
                                .setup.user.addr('082111')
                                .inputs(
                                    {session_event: "new"},
                                    { content: '1',
                                      provider: 'CellC' },  // state_clinic_type
                                    'Quad Street',  // state_suburb
                                    '3'  // state_suburb
                                )
                                .check(function(api) {
                                    var contact = _.find(api.contacts.store, {
                                                        msisdn: '+082111'
                                                    });
                                    assert.equal(contact.extra[
                                        'location:formatted_address'],
                                        'Suburb number 3, City number 3');
                                    assert.equal(contact.extra[
                                        'location:lon'], '3.3');
                                    assert.equal(contact.extra[
                                        'location:lat'], '3.33');
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
                        .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '2',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street',  // state_suburb
                        '1'  // state_health_services
                    )
                    .check.interaction({
                        state: 'state_thanks',
                        reply:
                            "Thanks for using the Healthsites " +
                            "Service. Opt out at any stage by " +
                            "SMSing 'STOP' in reply to your " +
                            "clinic info message."
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                                                msisdn: '+082111'
                                            });
                        assert.equal(contact.extra.health_services, 'male');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("if the user two finds clinics", function() {
            it("should increase the sum.multiple_times_users metric",
            function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'MTN' },  // state_clinic_type
                        '1',  // state_locate_permission
                        '2',  // state_health_services
                        {session_event: "new"},
                        { content: '2',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street'  // state_suburb
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.multiple_time_users'].values, [1]);
                    })
                    .run();
            });

            it("should track the service provider metric", function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'MTN' },  // state_clinic_type
                        '1',  // state_locate_permission
                        '2',  // state_health_services
                        {session_event: "new"},
                        { content: '2',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street'  // state_suburb
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.service_provider.mtn'].values, [1]);
                        assert.deepEqual(metrics['sum.service_provider.other'].values, [1]);
                    })
                    .run();
            });

            it("should track the locate type metric", function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'MTN' },  // state_clinic_type
                        '1',  // state_locate_permission
                        '2',  // state_health_services
                        {session_event: "new"},
                        { content: '2',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street'  // state_suburb
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.locate_type.suburb'].values, [1]);
                        assert.deepEqual(metrics['sum.locate_type.lbs'].values, [1]);
                    })
                    .run();
            });
        });

        describe("if the user finds three clinics", function() {
            it("should increase the sum.multiple_times_users metric",
            function() {
                return tester
                    .setup.user.addr('082111')
                    .inputs(
                        {session_event: "new"},
                        { content: '1',
                          provider: 'MTN' },  // state_clinic_type
                        '1',  // state_locate_permission
                        '2',  // state_health_services
                        {session_event: "new"},
                        { content: '1',
                          provider: 'CellC' },  // state_clinic_type
                        'Friend Street',  // state_suburb
                        '2',  // state_health_services
                        {session_event: "new"},
                        { content: '1',
                          provider: 'CellC' },  // state_clinic_type
                        'Quad Street',  // state_suburb
                        '3'  // state_suburb
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.usaid_clinicfinder_test;
                        assert.deepEqual(metrics['sum.multiple_time_users'].values, [1]);
                    })
                    .run();
            });
        });

    });
});
