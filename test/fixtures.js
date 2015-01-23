module.exports = function() {
   return [
      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/",
            "data": {
               "search": {
                  "mmc": "true"
               },
               "response": {
                  "type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
               },
               "location": {
                  "point": {
                     "type": "Point",
                     "coordinates": [3.3, 3.33]
                  }
               }
            }
         },
         "response": {
            "data": {
               "id": 1,
               "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/1/",
               "search": {
                  "mmc": "true"
               },
               "response": {
                  "type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
               },
               "location": {
                  "id": 1,
                  "point": {
                     "type": "Point",
                     "coordinates": [3.3, 3.33]
                  }
               }
            }
         }
      },


      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/",
            "data": {
               "search": {
                  "mmc": "true"
               },
               "response": {
                  "type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
               },
               "location": {
                  "point": {
                     "type": "Point",
                     "coordinates": [3.1415, 2.7182]
                  }
               }
            }
         },
         "response": {
            "data": {
               "id": 2,
               "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/2/",
               "search": {
                  "mmc": "true"
               },
               "response": {
                  "type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
               },
               "location": {
                  "id": 2,
                  "point": {
                     "type": "Point",
                     "coordinates": [3.1415, 2.7182]
                  }
               }
            }
         }
      },


      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/lbsrequest/",
            "data": {
               "search": {
                  "msisdn": "082111"
               },
               "pointofinterest": {
                  "search": {
                     "mmc": "true",
                     "hct": "true"
                  },
                  "response": {
                     "type": "SMS",
                     "to_addr": "+082111",
                     "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
                  },
                  "location": null
               }
            }
         },
         "response": {
            "data": {
               "id": 1,
               "url": "http://127.0.0.1:8000/clinicfinder/lbsrequest/1/",
               "search": {
                  "msisdn": "082111"
               },
               "pointofinterest": {
                  "id": 3,
                  "search": {
                     "mmc": "true",
                     "hct": "true"
                  },
                  "response": {
                     "type": "SMS",
                     "to_addr": "+082111",
                     "template": "Your nearest clinic is {{ results }}. Thanks for using Clinic Finder"
                  },
                  "location": null
               }
            }
         }
      }

   ];
};
