module.exports = function() {
   return [
      {
         "request": {
            "method": "POST",
            "url": "http://127.0.0.1:8000/clinicfinder/requestlocation/",
            "data": {
               "point": {
                  "type": "Point",
                  "coordinates": [
                     null,
                     null
                  ]
               }
            }
         },
         "response": {
            "data": {
               "id": 2,
               "point": {
                  "type": "Point",
                  "coordinates": [
                     null,
                     null
                  ]
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
               "location": "http://127.0.0.1:8000/clinicfinder/requestlocation/2/"
            }
         },
         "response": {
            "data": {
               "url": "http://127.0.0.1:8000/clinicfinder/requestlookup/1/",
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
      }
   ];
};
