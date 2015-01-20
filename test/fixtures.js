module.exports = function() {
   return [
      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlocation/",
            "data": {
               "point": {
                  "type": "Point",
                  "coordinates": ["3.3", "3.33"]
               }
            }
         },
         "response": {
            "data": {
               "id": 1,
               "point": {
                  "type": "Point",
                  "coordinates": ["3.3", "3.33"]
               }
            }
         }
      },


      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlocation/",
            "data": {
               "point": {
                  "type": "Point",
                  "coordinates": ["3.1415", "2.7182"]
               }
            }
         },
         "response": {
            "data": {
               "id": 2,
               "point": {
                  "type": "Point",
                  "coordinates": ["3.1415", "2.7182"]
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
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": "http://127.0.0.1:8000/clinicfinder/requestlocation/1/"
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
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": "http://127.0.0.1:8000/clinicfinder/requestlocation/1/",
               "created_at": "2015-01-14T10:40:16.892Z",
               "updated_at": "2015-01-14T10:40:16.892Z"
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
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": "http://127.0.0.1:8000/clinicfinder/requestlocation/2/"
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
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": "http://127.0.0.1:8000/clinicfinder/requestlocation/2/",
               "created_at": "2015-01-14T10:40:16.892Z",
               "updated_at": "2015-01-14T10:40:16.892Z"
            }
         }
      },


      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/",
            "data": {
               "search": {
                  "mmc": "true",
                  "hct": "true"
               },
               "response": {
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": null
            }
         },
         "response": {
            "data": {
               "id": 3,
               "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/3",
               "search": {
                  "mmc": "true",
                  "hct": "true"
               },
               "response": {
                  "template_type": "SMS",
                  "to_addr": "+082111",
                  "template": "Your nearest clinic is %result%. Thanks for using Clinic Finder"
               },
               "location": null  ,
               "created_at": "2015-01-14T10:40:16.892Z",
               "updated_at": "2015-01-14T10:40:16.892Z"
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
               "pointofinterest": "http://127.0.0.1:8000/clinicfinder/requestlookup/3/"
            }
         },
         "response": {
            "data": {
               "id": 1,
               "url": "http://127.0.0.1:8000/clinicfinder/lbsrequest/",
               "search": {
                  "msisdn": "082111"
               },
               "pointofinterest": "http://127.0.0.1:8000/clinicfinder/requestlookup/3/",
               "created_at": "2015-01-14T10:40:16.892Z",
               "updated_at": "2015-01-14T10:40:16.892Z"
            }
         }
      }

   ];
};
