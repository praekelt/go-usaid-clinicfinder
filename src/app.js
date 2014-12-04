go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;


    var GoApp = App.extend(function(self) {
        App.call(self, 'state_clinic_type');
        var $ = self.$;

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
                        case 'locate': return 'state_clinic_names';
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
                        case 'consent': return 'state_clinic_names';
                        case 'suburb': return 'state_suburb';
                        case 'quit': return 'state_quit';
                    }
                }
            });
        });

        self.states.add('state_suburb', function(name) {
            return new FreeText(name, {
                question:
                    $("To find your closest clinic we need to know " +
                      "what suburb or area u are in. Please be " +
                      "specific. e.g. Inanda Sandton"),

                next: 'state_clinic_names'
            });
        });

        self.states.add('state_clinic_names', function(name) {
            return new EndState(name, {
                text:
                    $("Clinic 1, Clinic 2"),

                next: 'state_clinic_type'
            });
        });

        self.states.add('state_quit', function(name) {
            return new EndState(name, {
                text:
                    $("Thanks for using Clinic Finder. For info on " +
                      "MMC visit brothersforlife.org. For info on " +
                      "HCT visit zazi.org.za. Find a clinic on the " +
                      "web visit healthsites.org.za"),

                next: 'state_clinic_type'
            });
        });
    });

    return {
        GoApp: GoApp
    };
}();
