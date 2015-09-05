
var qr = require('qr-code');
var ajax = require('ajax');
var currency = require('currency');

ajax.getJSON('/campaign', function(res){
  campaigns[0].pledged = res.usd;
  campaigns[0].target = res.targetUsd;
  campaigns[0].wallets.bitcoin.address = res.wallets.btc;
  campaigns[0].wallets.dogecoin.address = res.wallets.doge;
  updateCampaigns();
});

var campaigns = [
  {
    name: 'milestone I',
    pledged: 0,
    target: 2000,
    wallets: {
      bitcoin: {
        address: ''
      },
      dogecoin: {
        address: ''
      }
    },
    dogetails: "many modules ,such abstract! import wow !! plerdge woof!",
    details:
        "help fund the development of milestone I to enable:<br> "
      + "user profiles, project saving & sharing, module library, "
      + "audio record & download, code export, debug console and settings."
  }
];

function updateCampaigns(){
  campaigns.forEach(function(c){
    c.percentage = Math.floor(c.pledged / c.target * 100);

    c.wallets.bitcoin.uri = 'bitcoin:' + c.wallets.bitcoin.address;
    c.wallets.bitcoin.qrcode = qr(c.wallets.bitcoin.uri, { margin: 10, level: 'Q' });

    c.wallets.dogecoin.uri = 'dogecoin:' + c.wallets.dogecoin.address;
    c.wallets.dogecoin.qrcode = qr(c.wallets.dogecoin.uri, { margin: 10, level: 'Q' });
  });
}

module.exports = campaigns;
