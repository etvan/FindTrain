const puppeteer = require('puppeteer');
const {DEPART,ARRIVEE,DATE_DEPART,DATE_RETOUR,ESCALE} = require('./constantes');

async function clique_connexion(page) {
  await page.waitForSelector('.header__signin > button');
  await page.waitFor(10000);
  await page.click('.header__signin > button');
}

async function connexion_trainline(page) {
  await page.waitFor(1000);
  await page.waitForSelector(".signin__form > input[name='email']");
  await page.focus(".signin__form > input[name='email']");
  await page.keyboard.type(process.env.LOGIN_TRAINLINE);
  await page.waitForSelector(".signin__form > input[name='password']");
  await page.focus(".signin__form > input[name='password']");
  await page.keyboard.type(process.env.PASSWORD_TRAINLINE);
  await page.waitForSelector('#signin-form > div.signin__buttons.signin__buttons--wrapped > div:nth-child(2) > button');
  await page.click('#signin-form > div.signin__buttons.signin__buttons--wrapped > div:nth-child(2) > button');
}

async function selection_date(page,jour,mois) {
  await page.waitForSelector('.search__departure-date > input');
  await page.click('.search__departure-date > input');
  await page.waitForSelector('.search__calendar--increment-month');
  await page.waitFor(1000);
  await page.evaluate(({mois}) => {
    if (!document.querySelector('.search__calendar--current-month').textContent.includes(mois)) {
      document.querySelector('.search__calendar--increment-month').click();
    }
  },{mois});
  await page.waitFor(1000);
  await page.evaluate(({jour}) => {
    for (var i=0;i<document.querySelectorAll('.search__calendar > tbody > tr > td:not(.disabled):not(.not-current-month)').length;i++){
      if (document.querySelectorAll('.search__calendar > tbody > tr > td:not(.disabled):not(.not-current-month)')[i].textContent.trim() == jour){
        document.querySelectorAll('.search__calendar > tbody > tr > td:not(.disabled):not(.not-current-month)')[i].click();
      }
    }
  },{jour});
}

async function selection_horaire(page,heure) {
  await page.waitForSelector('.search__timeslots');
  await page.evaluate(({heure}) => {
    for (var i=0;i<document.querySelectorAll('.search__timeslots > time').length;i++) {
      if (document.querySelectorAll('.search__timeslots > time')[i].textContent.trim() == heure) {
        document.querySelectorAll('.search__timeslots > time')[i].click();
      }
    }
  },{heure});
}

async function affichage_trains(page,depart,arrivee) {
  await page.waitForSelector('.time');
  await page.waitForSelector('.search__results-folder-label');
  await page.evaluate(({depart,arrivee}) => {
    for(var i =0;i<document.getElementsByClassName('time').length;i++){
        console.log(depart+" -> "+arrivee+" : "
        +document.getElementsByClassName('time')[i].textContent
        +", Prix : "
        +document.querySelectorAll('.third .search__results-folder-label')[i].textContent.trim());
  }
  }, {depart,arrivee});
}

async function modifier_recherche(page) {
  await page.waitForSelector('#ct__application > div.application.transition-none > div.application__body-container > div > div.search__results > div.search__results--title > button');
  await page.click('#ct__application > div.application.transition-none > div.application__body-container > div > div.search__results > div.search__results--title > button');
}

async function rechercher_trains(page,depart,arrivee,jour_depart,mois_depart,heure) {
  await page.waitFor(2000);
  await page.waitForSelector('.grouped-input--top > input');
  await page.focus('.grouped-input--top > input');
  await page.keyboard.type(depart);
  await page.waitForSelector('.grouped-input--bottom > input');
  await page.focus('.grouped-input--bottom > input');
  await page.keyboard.type(arrivee);
  await selection_date(page,jour_depart,mois_depart);
  await selection_horaire(page,heure);
  await page.waitFor(1000);
  await page.click('.grouped-input--top > input');
  await page.click('.grouped-input--bottom > input');
  await page.waitForSelector('.search__button > button');
  await page.click('.search__button > button');
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    // args: [ '--proxy-server=' ]
  });
  const page = await browser.newPage();
  page.on('console', consoleObj => console.log(consoleObj.text()));
  await page.setViewport({ width: 1920, height: 1080 })  
  await page.goto('https://www.trainline.fr');

  //CLIQUE BOUTON

  await clique_connexion(page);

  //CONNEXION

  await connexion_trainline(page);

  //ALLER

  console.log('\n*** ALLER DIRECT ***\n');

  await rechercher_trains(page,DEPART,ARRIVEE,DATE_DEPART[0],DATE_DEPART[1],DATE_DEPART[2]);
  console.log('\nAller le '+DATE_DEPART[0]+' '+DATE_DEPART[1]+' de '+DEPART+' à '+ARRIVEE+'\n');
  await affichage_trains(page,DEPART,ARRIVEE);

  //MODIFIER

  await modifier_recherche(page);

  //RETOUR

  console.log('\n*** RETOUR DIRECT ***\n');

  await rechercher_trains(page,ARRIVEE,DEPART,DATE_RETOUR[0],DATE_RETOUR[1],DATE_RETOUR[2]);
  console.log('\nRetour le '+DATE_RETOUR[0]+' '+DATE_RETOUR[1]+' de '+ARRIVEE+' à '+DEPART+'\n');
  await affichage_trains(page,ARRIVEE,DEPART);

  //ALLER AVEC ESCALE

  for(var i=0;i<ESCALE.length;i++) {

    console.log('\n*** ALLER via '+ESCALE[i]+' ***\n');

    await modifier_recherche(page);
    await rechercher_trains(page,DEPART,ESCALE[i],DATE_DEPART[0],DATE_DEPART[1],DATE_DEPART[2]);
    console.log(console.log('\nAller le '+DATE_DEPART[0]+' '+DATE_DEPART[1]+' de '+DEPART+' à '+ESCALE[i]+'\n'));
    await affichage_trains(page,DEPART,ESCALE[i]);

    await modifier_recherche(page);
    await rechercher_trains(page,ESCALE[i],ARRIVEE,DATE_DEPART[0],DATE_DEPART[1],DATE_DEPART[2]);
    console.log(console.log('\nAller le '+DATE_DEPART[0]+' '+DATE_DEPART[1]+' de '+ESCALE[i]+' à '+ARRIVEE+'\n'));
    await affichage_trains(page,ESCALE[i],ARRIVEE);

    console.log('\n*** RETOUR via '+ESCALE[i]+' ***\n');

    await modifier_recherche(page);
    await rechercher_trains(page,ARRIVEE,ESCALE[i],DATE_RETOUR[0],DATE_RETOUR[1],DATE_RETOUR[2]);
    console.log(console.log('\nRetour le '+DATE_RETOUR[0]+' '+DATE_RETOUR[1]+' de '+ARRIVEE+' à '+ESCALE[i]+'\n'));
    await affichage_trains(page,ARRIVEE,ESCALE[i]);

    await modifier_recherche(page);
    await rechercher_trains(page,ESCALE[i],DEPART,DATE_RETOUR[0],DATE_RETOUR[1],DATE_RETOUR[2]);
    console.log(console.log('\nRetour le '+DATE_RETOUR[0]+' '+DATE_RETOUR[1]+' de '+ESCALE[i]+' à '+DEPART+'\n'));
    await affichage_trains(page,ESCALE[i],DEPART);
  }
    //await browser.close();
})();