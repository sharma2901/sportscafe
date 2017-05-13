/**
 * Created by surya on 5/12/17.
 */
let express = require('express');
let bodyParser = require('body-parser');
let rp = require('request-promise');
let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index', {title: 'Sports Cafe'});
});

function checkAndRender(totalPromise, finalResult, riders, res) {
    if (totalPromise === 0) {
        finalResult.riders = riders;
        res.render('details', {title: 'Sports Cafe', data: finalResult});
    }
}
app.get('/api/findRiders', (req, res) => {
    let baseUrl = 'http://swapi.co/api/';
    let url = '';
    let finalResult = {};
    let type = req.query.type;
    let id = req.query.id;

    if(type === 'vehicle') {
        url = baseUrl + 'vehicles/';
    } else {
        url = baseUrl + 'starships/';
    }

    rp(url + id)
      .then(result => {
          result = JSON.parse(result);
          let riders = [];
          finalResult.name = result.name;
          finalResult.model = result.model;
          if(result.pilots.length > 0) {
              let totalPromise = 3 * result.pilots.length;
              for (let i = 0; i < result.pilots.length; i++) {
                  let currRiderPromises = 3;
                  let currPilot = result.pilots[i];
                  rp(currPilot)
                    .then(rider => {
                        rider = JSON.parse(rider);
                        let riderObj = {};
                        let speciesArr = [];
                        let filmArr = [];
                        riderObj.name = rider.name;
                        riderObj.gender = rider.gender;


                        rp(rider.homeworld)
                          .then(homeworld => {
                              homeworld = JSON.parse(homeworld);
                              riderObj.homeworld = homeworld.name;
                              currRiderPromises--;
                              if (currRiderPromises === 0) {
                                  riders.push(riderObj);
                              }
                              totalPromise--;
                              checkAndRender(totalPromise, finalResult, riders, res);
                          });


                        for (let i = 0; i < rider.species.length; i++) {
                            rp(rider.species[i])
                              .then(species => {
                                  species = JSON.parse(species);
                                  speciesArr.push(species.name);
                                  if (i === rider.species.length-1) {
                                      riderObj.species = speciesArr;
                                      totalPromise--;
                                      currRiderPromises--;
                                      if (currRiderPromises === 0) {
                                          riders.push(riderObj);
                                      }
                                      checkAndRender(totalPromise, finalResult, riders, res);
                                  }
                              })
                        }


                        for (let i = 0; i < rider.films.length; i++) {
                            rp(rider.films[i])
                              .then(film => {
                                  film = JSON.parse(film);
                                  filmArr.push(film.title);
                                  if (i === rider.films.length-1) {
                                      riderObj.films = filmArr;
                                      totalPromise--;
                                      currRiderPromises--;
                                      if (currRiderPromises === 0) {
                                          riders.push(riderObj);
                                      }
                                      checkAndRender(totalPromise, finalResult, riders, res);
                                  }
                              })
                        }

                    })
              }
          } else {
              finalResult.riders = 'No riders';
              res.render('details', {title: 'Sports Cafe', data: finalResult});
          }

      })
      .catch(err => {
          console.log(err.message);
          res.render('details', {title: 'Sports Cafe', err: err});
      });

});

app.listen(9500, function () {
    console.log('listening on port 9500!');
});