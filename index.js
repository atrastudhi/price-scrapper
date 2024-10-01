const puppeteer = require('puppeteer');

const puppeteerConfigWithHead = { 
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'] 
}

const pageOptions = {
  waitUntil: 'networkidle0',
  timeout: 10000,
};

const userAgents = [
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36,gzip(gfe)',
  'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0',
  'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
  'Mozilla/5.0 (Windows NT 6.1; rv:40.0) Gecko/20100101 Firefox/40.0'
];

const items = [
  {
    productName: 'Bango 735ml',
    lazadaUrl: 'https://www.lazada.co.id/products/bango-kecap-manis-soy-sauce-refill-terbuat-dari-4-bahan-alami-berkualitas-735-ml-i6294882431-s11967158380.html?dsource=share&laz_share_info=475956450_100_100_400158225030_475956450_null&laz_token=8309d5677334ec5990bffd9813165efb&exlaz=e_I2NdFQGHoUfGip8qo24MCZxWHrQEPErDOJB%2FxtnrDRrCXvTKdNAtBQeDSccmTc7tGyw%2B95whJf%2BHlnctGakMAgm%2FyaLE3L0KD3WnASIas1Y%3D&sub_aff_id=social_share&sub_id2=475956450&sub_id3=400158225030&sub_id6=CPI_EXLAZ',
    shopeeUrl: 'https://shopee.co.id/product/14318452/11624035073',
  },
  {
    productName: 'Bango 520ml',
    lazadaUrl: 'https://www.lazada.co.id/products/bango-kecap-manis-soy-sauce-refill-terbuat-dari-4-bahan-alami-berkualitas-520ml-i6029292901-s11590094611.html?dsource=share&laz_share_info=476529869_3_6500_400158225030_476529869_null&laz_token=bec78122514d4107e5538926a392ec57&exlaz=e_tU5OQpo2%2BjrGip8qo24MCZxWHrQEPErDOJB%2FxtnrDRrZwT6Rq4aTKNfL3tWoTsuVPa%2BnLVta0jc00QT8NJ0GFsUsyP%2ByaoFuD3WnASIas1Y%3D&sub_aff_id=social_share&sub_id2=476529869&sub_id3=400158225030&sub_id6=CPI_EXLAZ',
  },
  {
    productName: 'Royco 220g',
    lazadaUrl: 'https://www.lazada.co.id/products/royco-bumbu-kaldu-penyedap-makanan-penyedap-rasa-ayam-beryodium-220g-i6399770707-s12136430338.html?dsource=share&laz_share_info=476530544_3_6500_400158225030_476530544_null&laz_token=9ac939fa45449d03f9246419a31104d0&exlaz=e_tU5OQpo2%2BjrGip8qo24MCZxWHrQEPErDOJB%2FxtnrDRrZwT6Rq4aTKNfL3tWoTsuVPa%2BnLVta0jc00QT8NJ0GFsUsyP%2ByaoFuD3WnASIas1Y%3D&sub_aff_id=social_share&sub_id2=476530544&sub_id3=400158225030&sub_id6=CPI_EXLAZ',
  }
];

const shopeeUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

let finalResult = {};

const executeLazadaPage = async (browser, item) => {
  const userAgent = userAgents[Math.floor(Math.random()*userAgents.length)];
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(userAgent);

    console.log(`!!! RUNNING executeLazadaPage | ITEM: ${item.productName} | USER-AGENT: ${userAgent} !!!`);

    await page.goto(item.lazadaUrl, pageOptions);

    const element = await page.$('.pdp-price');
    const priceText = element ? await element.evaluate((el) => el.textContent) : null;

    if (!priceText) {
      await page.close();
      await executeLazadaPage(browser, item);
    } else {
      if (finalResult[item.productName]) {
        finalResult[item.productName].lazadaPrice = priceText;
      } else {
        finalResult[item.productName] = {
          lazadaPrice: priceText,
        };
      }
      await page.close();
    }
  } catch (err) {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    await page.close();
    await executeLazadaPage(browser, item);
  }
};

const lazadaCheck = async (browser) => {
  const promises = [];

  for (let item of items) {
    promises.push(executeLazadaPage(browser, item));
  }

  await Promise.all(promises);
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const shopeeLogin = async (browser) => {
  const page = await browser.newPage();
  await page.setUserAgent(shopeeUserAgent);

  await page.goto('https://shopee.co.id/buyer/login', { waitUntil: 'networkidle0' });

  await page.type('input[name="loginKey"]', process.env.loginKey);
  await page.type('input[name="password"]', process.env.password);

  await timeout(1000);

  const [button] = await page.$x("//button[contains(., 'Log in')]");
  if (button) await button.click();

  await timeout(2000)

  return page.url();
};

const executeShopeePage = async (browser, item) => {
  console.log(`!!! RUNNING executeShopeePage | ITEM: ${item.productName} | USER-AGENT: ${shopeeUserAgent} !!!`);
  let page;
  try {
    page = await browser.newPage();
    await page.goto(item.shopeeUrl, { waitUntil: 'networkidle0', timeout: 10000 });
  
    const element = await page.$('.pqTWkA');
    const priceText = element ? await element.evaluate((el) => el.textContent) : null;
  
    if (!priceText) {
      await page.close();
      await executeShopeePage(browser, item);
    } else {
      if (finalResult[item.productName]) {
        finalResult[item.productName].shopeePrice = priceText;
      } else {
        finalResult[item.productName] = {
          shopeePrice: priceText,
        };
      }
      await page.close();
    }
  } catch (err) {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    await page.close();
    await executeShopeePage(browser, item);
  }
}

const shopeeCheck = async (browser) => {
  const loginResult = await shopeeLogin(browser);

  const promises = [];

  if (loginResult !== 'https://shopee.co.id/verify/ivs?is_initial=true') {
    for (let item of items) {
      if (item.shopeeUrl) promises.push(executeShopeePage(browser, item));
    }
  }

  await Promise.all(promises);
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch(puppeteerConfigWithHead);

    await Promise.all([
      lazadaCheck(browser),
      shopeeCheck(browser),
    ]);

    console.log(finalResult);
    browser.close();
  } catch (err) {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    browser.close();
  }
})();
