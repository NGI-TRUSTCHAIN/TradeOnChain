import $, { error } from 'jquery';
import ons from 'onsenui';
import moment from 'moment-timezone/builds/moment-timezone-with-data-10-year-range.min.js';
import { DEBUG, LANG, showToast, onPullHookChangeState, getParameterByName, getCookie, setCookie } from  '../../src/js/script.js';

import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { createActor, canisterId } from "../../icp-buyer-seller-contract-backend"
const { v4: uuidv4 } = require('uuid');
import fs from 'fs';
import axios from 'axios';
import i18next from 'i18next';
import introJs from 'intro.js';
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'local';
const envFile = ".env."+env;
const result = dotenv.config({ path: path.resolve('./' , envFile) });
if(result.error) {
  console.error(`Error loading ${envFile}:`, result.error);
} else {
  console.log(`Loaded environment file: ${envFile}`);
}

const APP_URL = process.env.APP_URL;
const API_URL = process.env.API_URL;
const BEARER_TOKEN = process.env.API_TOKEN;

const TRANSAK_API_URL= process.env.TRANSAK_API_URL;
const TRANSAK_API_KEY= process.env.TRANSAK_API_KEY;	

const CANISTER_ID = process.env.CANISTER_ID; // "bkyz2-fmaaa-aaaaa-qaaaq-cai" // local
const DFX_NETWORK = process.env.DFX_NETWORK; // "http://127.0.0.1:4943" // local
const CANISTER_ETHERUM_ADDRESS = process.env.CANISTER_ETHERUM_ADDRESS;

var editContractTimeout;

$(document).ready(async function() {
    
  ons.ready(async function() {
    	if(DEBUG) console.log("Onsen ready");
    	ons.disableDeviceBackButtonHandler();

      const authClient = await AuthClient.create();
      const isAuthenticated = await authClient.isAuthenticated();
      
  		if(isAuthenticated) {
        const templateName = "footerMenuTemplate";
        document.querySelector('#myNavigator').pushPage(templateName);
        window.history.pushState({page: templateName}, templateName);
  		} else {
        const templateName = "loginTemplate";
        document.querySelector('#myNavigator').pushPage(templateName);
        window.history.pushState({page: templateName}, templateName);
		}	  
  });

});

// On page init
document.addEventListener('init', function(event) {
	var page = event.target;
	if(page.id=="") return;
	if(DEBUG) console.log("Init event for page: "+page.id);	
	switch(page.id) {
		case 'loginPage':
			initializeLoginPage(page);
			break;
    case 'footerMenuPage':
      initializeFooterMenuPage(page);
      break;
		case 'accountPage':
			initializeAccountPage(page);
			break;
    case 'editAccountPage':
      initializeEditAccountPage(page);
      break;
    case 'editContractPage':
        initializeEditContractPage(page);
        break;
    case 'viewContractPage':
			initializeViewContractPage(page);
			break;
    case 'viewContractChangesPage':
      initializeViewContractChangesPage(page);
      break;
    case 'shareContractPage':
      initializeShareContractPage(page);
      break;
    case 'addContractPage':
      initializeAddContractPage(page);
      break;
    case 'adminPage':
      initializeAdminPage(page);
      break;
	}		
});
// On page show
document.addEventListener('show', function(event) {
  var page = event.target;
	if(page.id=="") return;
	if(DEBUG) console.log("Showing page: "+page.id);
	var pageElement = $("#"+page.id).localize();
	switch(page.id) {
		case 'loginPage':
			break;
	}
});
// On page hide
document.addEventListener('hide', function(event) {
	var page = event.target;
	if(page.id=="") return;
	if(DEBUG) console.log("Hiding page: "+page.id);
	switch(page.id) {
		case 'loginPage':
			break;
	}
});
// On page destroy
document.addEventListener('destroy', function(event) {
	var page = event.target;
	if(page.id=="") return;
	if(DEBUG) console.log("Destroying page: "+page.id);
	switch(page.id) {
		case 'loginPage':
			break;
	}
});

// footerMenuPage
async function initializeFooterMenuPage(page) {
	if(DEBUG) console.log("Initializing footerMenuPage...");
	var pageElement = $("#"+page.id).localize();
  new ResizeObserver(function(){
    //$("#footerMenuPage").find(".page__content").height(window.innerHeight - 56);
  }).observe(pageElement.find(".page__content")[0]);

  initializeNavdrawer();
  
  var flag = (LANG=="en") ? "gb" : LANG;
  $("[data-target='#languageModal']").find(".flag").removeClass(function(index, className) {
    return (className.match(/\bflag-icon-\S+/g) || []).join(' ');
  }).addClass("flag-icon-"+flag);

  var uid = getParameterByName(window.location.href, "sharedContract");
  if(typeof uid!=='undefined' && uid!==null) {
    const templateName = "addContractTemplate";
    ons.createDialog(templateName, { append: true }).then(function(dialog) {
        $(dialog).attr("data-uid", uid);
        dialog.show();
        window.history.pushState({page: templateName}, templateName);
    });
  }


}
function initializeNavdrawer() {
  if(DEBUG) console.log("Initializing navdrawer...");

  $("#navdrawer").find('#logoutBtn').off("click").on("click", async function() {
    if(DEBUG) console.log("Click on logoutBtn...");
    const authClient = await AuthClient.create();
    await authClient.logout();
    window.location.href = '/';
  });
}
// loginPage
async function initializeLoginPage(page) {
	if(DEBUG) console.log("Initializing login page...");
	var pageElement = $("#"+page.id).localize();
	
	const authClient = await AuthClient.create();
   
  pageElement.find('#loginBtn').on("click", async function() {
    if(DEBUG) console.log("Click on loginBtn...");
    authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: async function() {
          console.log("Login callback");
          window.location.reload();
        }
    });
  });
}
// accountPage
async function initializeAccountPage(page) {
	if(DEBUG) console.log("Initializing accountPage...");
	var pageElement = $("#"+page.id).localize();
  getViewAccount();
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getViewAccount(done);
  };
  pageElement.find("#addContractBtn").off("click").on("click", function(){
    console.log("Click on addContractCardBtn...");
    pageElement.find("#createContractCard").slideToggle();
  });

  pageElement.find("#createContractBtn").off("click").on("click", function(e){
    e.preventDefault();
    console.log("Click on createContractBtn...");
    createContract();
  });

  pageElement.find('#editAccountBtn').off("click").on("click", async function() {
    console.log("Click on editAccountBtn...");
    var templateName = "editAccountTemplate";
    document.querySelector('#myNavigator').pushPage(templateName);
    window.history.pushState({page: templateName}, templateName);
  });
}
async function getViewAccount(done) {
  if(DEBUG) console.log("Getting account...");
	var pageElement = $("#accountPage");
  var content = pageElement.find("#content");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();

	const authClient = await AuthClient.create();
  const isAuthenticated = await authClient.isAuthenticated();
  const principal = authClient.getIdentity().getPrincipal().toText();
  setCookie("principal", principal, 365);

  pageElement.find("#accountCard").find("#principal").text(principal);

  getAccount(principal).then((account) => {
    if(account!=null && account.role=="admin") {
      $("#topToolbar").find("#adminBtn").off("click").on("click", function(){
        if(DEBUG) console.log("Click on adminBtn...");
        var templateName = "adminTemplate";
        document.querySelector('#myNavigator').pushPage(templateName);
        window.history.pushState({page: templateName}, templateName);
      }).show();
      $("#navdrawer").find("#adminBtn").off("click").on("click", function(){
        if(DEBUG) console.log("Click on adminBtn...");
        var templateName = "adminTemplate";
        document.querySelector('#myNavigator').pushPage(templateName);
        window.history.pushState({page: templateName}, templateName);
      }).show();
    }
  });

  getContracts(principal).then((contracts) => {
    if(contracts!==null && contracts.length>0) {
      content.find("#contractList").empty();
      contracts.forEach(contract => {
        var html = "";
        html += "<div class='list-group-item list-group-item-action contract' uid='"+contract.uid+"'>";
        html += "<div class='info'>"
        html += "<div class='badge badge-pill status "+contract.status+"' data-i18n='contractStatus."+contract.status+"'></div>";
        html += "<div class='name'>"+contract.name+"</div>";
        if(contract.sellerId==principal) {
          html += "<div class='role'>"+i18next.t("accountPage.Seller")+"</div>";
        } else if(contract.buyerId==principal) {
          html += "<div class='role'>"+i18next.t("accountPage.Buyer")+"</div>";
        }
        var disabled = (contract.status!=="draft") ? "disabled" : "";
        html += "</div>";
        html += "<div class='btns'>";
        html += "<button class='btn viewBtn'><span class='material-symbols-outlined icon'>visibility</span></button>";
        html += "<button class='btn editBtn' "+disabled+"><span class='material-symbols-outlined icon'>edit</span></button>";
        html += "<button class='btn deleteBtn' "+disabled+"><span class='material-symbols-outlined icon'>delete</span></button>";
        html += "<button class='btn shareBtn'><span class='material-symbols-outlined icon'>share</span></button>";
        html += "</div>";
        html += "</div>";
        $("#contractList").append(html).localize();
      });
      content.find("#noContracts").hide();
      content.find("#contractList").show();
      content.find("#contractList").find(".contract").off("click").on("click", function(e){
        if(DEBUG) console.log("Click on contract...");
        const uid = $(this).attr("uid");
        var templateName = "";
        if($(e.target).closest(".btn").hasClass("viewBtn")) {
          templateName = "viewContractTemplate";
        } else if($(e.target).closest(".btn").hasClass("editBtn")) {
          templateName = "editContractTemplate";
        } else if($(e.target).closest(".btn").hasClass("deleteBtn")) {
          $(this).prop("disabled", true);
          // Safe delete
          $("#confirmOperationModal").modal("show");
          $("#confirmOperationModal").find("#confirmOperationBtn").off("click").on("click", function(){	
            if(DEBUG) console.log("Click on confirmOperationBtn...");
            deleteContract(uid).then((contract) => {
              getViewAccount();
            }).catch((error) => {
              showToast("Error deleting contract on database.");
              $(this).prop("disabled", false);
            });
            $("#confirmOperationModal").modal("hide");
          });
        } else if($(e.target).closest(".btn").hasClass("shareBtn")) {
          templateName = "shareContractTemplate";
        } else {
          templateName = "viewContractTemplate";
        }
        if(templateName!=="") {
          document.querySelector('#myNavigator').pushPage(templateName, {data: {uid: uid}});
          window.history.pushState({page: templateName}, templateName);
        }
      });
    } else {
      content.find("#noContracts").show();
      content.find("#contractList").hide();
    }
    content.show();
    progressCircular.hide();
    if(done) done();
  }).catch((error) => {
    if(DEBUG) console.error('Error:', error);
    if(done) done();
  });

}
async function createContract() {
  if(DEBUG) console.log("Creating contract...");
	var pageElement = $("#accountPage");
  var form = pageElement.find("#createContractForm");
  if(form[0].checkValidity() === false) {
    form.addClass('was-validated');
    return;
  }
  const time = Math.floor(Date.now()/1000);
  const principal = getCookie("principal");
  const contract = {
    uid: uuidv4(),
    name: form.find("input[name=name]").val(),
    data: null,
    buyerId: (form.find("select[name=role]").val()=="buyer") ? principal : null,
    sellerId: (form.find("select[name=role]").val()=="seller") ? principal : null,
    status: "draft",
    created: time,
    createdBy: principal,
    updated: time,
    updatedBy: principal
  };

  postContract(contract).then((contract) => {
    pageElement.find("#addContractBtn").trigger("click");
    getViewAccount();
    const templateName = "editContractTemplate";
    document.querySelector('#myNavigator').pushPage(templateName, {data: {uid: contract.uid}});
    window.history.pushState({page: templateName}, templateName);
  }).catch((error) => {
    showToast("Error saving contract on database.");
  });

}
// editAccountPage
async function initializeEditAccountPage(page) {
	if(DEBUG) console.log("Initializing editAccountPage...");
	var pageElement = $("#"+page.id).localize();
  getEditAccount();
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getEditAccount(done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });
  pageElement.find("#saveBtn").off("click").on("click", function(e){
    if(DEBUG) console.log("Click on saveBtn...");
    e.preventDefault();
    const form = pageElement.find("#editAccountForm");
    const time = Math.floor(Date.now()/1000);
    const principal = getCookie("principal");
    const account = {
      uid: form.find("input[name=uid]").val() || uuidv4(),
      id: principal,
      name: form.find("input[name=name]").val(),
      surname: form.find("input[name=surname]").val(),
      email: form.find("input[name=email]").val(),
      phone: form.find("input[name=phone]").val(),
      birthdate: form.find("input[name=birthdate]").val(),
      street: form.find("input[name=street]").val(),
      city: form.find("input[name=city]").val(),
      province: form.find("input[name=province]").val(),
      region: form.find("input[name=region]").val(),
      country: form.find("input[name=country]").val(),
      postalCode: form.find("input[name=postalCode]").val(),
      created: time,
      createdBy: principal,
      updated: time,
      updatedBy: principal
    };

    postAccount(account).then((account) => {
      document.querySelector('#myNavigator').popPage();
      showToast("Informazioni aggiornate!");
    }).catch((error) => {
      showToast("Error saving account on database.");
    });
  });
}
function getEditAccount(done) {
	if(DEBUG) console.log("Getting editAccount...");
  var pageElement = $("#editAccountPage");
  var content = pageElement.find("#content");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();

  const principal = getCookie("principal");
  
  getAccount(principal).then((account) => {
    const form = pageElement.find("#editAccountForm");
    form.find("input[name=uid]").val(account.uid);
    form.find("input[name=name]").val(account.name);
    form.find("input[name=surname]").val(account.surname);
    form.find("input[name=email]").val(account.email);
    form.find("input[name=phone]").val(account.phone);
    form.find("input[name=birthdate]").val(account.birthdate);
    form.find("input[name=street]").val(account.street);
    form.find("input[name=city]").val(account.city);
    form.find("input[name=province]").val(account.province);
    form.find("input[name=region]").val(account.region);
    form.find("input[name=country]").val(account.country);
    form.find("input[name=postalCode]").val(account.postalCode);
    content.show();
    progressCircular.hide();
    if(done) done();
  }).catch((error) => {
    showToast("Error");
    if(done) done();
  });
}
// editContractPage
function initializeEditContractPage(page) {
	if(DEBUG) console.log("Initializing editContractPage...");
	var pageElement = $("#"+page.id).localize();
  const form = pageElement.find("#editContractForm");

  const countries = i18next.t('countries', { returnObjects: true });
  for(let [code, country] of Object.entries(countries)) {
    pageElement.find("select[name='sellerCountry']").append("<option value='"+code+"'>"+country+"</option>");
    pageElement.find("select[name='buyerCountry']").append("<option value='"+code+"'>"+country+"</option>");
    pageElement.find("select[name='shippingCountry']").append("<option value='"+code+"'>"+country+"</option>");
  }

  getEditContract(page.data.uid);
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getEditContract(page.data.uid, done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });

  pageElement.find(".expansion-panel-toggler").off("click").on("click", function(e){
    if(DEBUG) console.log("Click on expansion-panel-toggler...");
    if($(e.target).attr("data-toggle")=="modal" && $(e.target).attr("data-target")=="#articleModal") {
      e.preventDefault();
      e.stopPropagation();
      generateArticleModal($(e.target).attr("data-article"), $(e.target).attr("data-subarticle"));
    }
  });
}
function generateArticleModal(article, subarticle) {
  if(DEBUG) console.log("Generating article modal...");
  const articleKey = "ART_"+article;
  var title = i18next.t("terms."+articleKey+".TITLE");
  var body = "";
  body += "<div class='mt-4'>";
  let terms = i18next.t('terms', { returnObjects: true });
  if(terms[articleKey]) {
      if(terms[articleKey].TEXT) {
          body += "<mark>"+terms[articleKey].TEXT+"</mark>";
      } else {
        body += Object.keys(terms[articleKey])
          .filter(k => k.startsWith(articleKey + "."))
          .map(k => ((typeof subarticle!=='undefined' && k==articleKey+"."+subarticle) ? `<p><mark>${terms[articleKey][k]}</mark></p>` : `<p>${terms[articleKey][k]}</p>`))
          .join("");
      }
  } else {
      modalBody.html("<p>Articolo non trovato.</p>");
  }
  body += "</div>";
  $("#articleModal").find(".modal-title").html(title);
  $("#articleModal").find(".modal-body").html(body);
  $("#articleModal").modal("show");
}
function getEditContract(uid, done) {
	if(DEBUG) console.log("Getting editContract...");
  var pageElement = $("#editContractPage");
  var content = pageElement.find("#content");
  var btn = pageElement.find("#saveBtn");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();
  
  getContract(uid).then((contract) => {
    const form = pageElement.find("#editContractForm");

    if(contract.data!==null) {
      var formData = JSON.parse(contract.data);

      const itemCodes = Array.isArray(formData["itemCode[]"]) ? formData["itemCode[]"] : [formData["itemCode[]"]];
      const itemDescriptions = Array.isArray(formData["itemDescription[]"]) ? formData["itemDescription[]"] : [formData["itemDescription[]"]];
      const itemQuantities = Array.isArray(formData["itemQuantity[]"]) ? formData["itemQuantity[]"] : [formData["itemQuantity[]"]];
      const itemPrices = Array.isArray(formData["itemPrice[]"]) ? formData["itemPrice[]"] : [formData["itemPrice[]"]];
      const itemCurrencies = Array.isArray(formData["itemCurrency[]"]) ? formData["itemCurrency[]"] : [formData["itemCurrency[]"]];
      const itemOrigins = Array.isArray(formData["itemOrigin[]"]) ? formData["itemOrigin[]"] : [formData["itemOrigin[]"]];
      const itemHScodes = Array.isArray(formData["itemHScode[]"]) ? formData["itemHScode[]"] : [formData["itemHScode[]"]];
      
      for(let i=0; i<itemCodes.length; i++) {
        if(i==0) {
          form.find("input[name='itemCode[]']").val(itemCodes[i]); 
          form.find("input[name='itemDescription[]']").val(itemDescriptions[i]);
          form.find("input[name='itemQuantity[]']").val(itemQuantities[i]);
          form.find("input[name='itemPrice[]']").val(itemPrices[i]);
          form.find("select[name='itemCurrency[]']").val(itemCurrencies[i]);
          form.find("input[name='itemOrigin[]']").val(itemOrigins[i]);
          form.find("input[name='itemHScode[]']").val(itemHScodes[i]);
        } else {
          var clone = form.find(".itemRow:first-child").clone();
          clone.find("input[name='itemCode[]']").val(itemCodes[i]); 
          clone.find("input[name='itemDescription[]']").val(itemDescriptions[i]);
          clone.find("input[name='itemQuantity[]']").val(itemQuantities[i]);
          clone.find("input[name='itemPrice[]']").val(itemPrices[i]);
          clone.find("select[name='itemCurrency[]']").val(itemCurrencies[i]);
          clone.find("input[name='itemOrigin[]']").val(itemOrigins[i]);
          clone.find("input[name='itemHScode[]']").val(itemHScodes[i]);
          clone.appendTo("#itemRows");
        }
      }  
    
      $.each(formData, function(key, value){
        if(key=="itemCode[]" || key=="itemDescription[]" || key=="itemQuantity[]" || key=="itemPrice[]" || key=="itemCurrency[]" || key=="itemHScode[]" || key=="itemOrigin[]") return;
        var inputElement = form.find("[name='"+key+"']");
        if(inputElement.is(":checkbox")) {
          inputElement.prop("checked", value);
        } else if(inputElement.is(":radio")) {
          form.find("input[name='"+key+"'][value='"+value+"']").prop("checked", value);
        } else {
          inputElement.val(value);
        }
      });
    }
    form.find("select[name=shippingTermId]").find("option").hide();
    form.find("select[name=shippingTermCatalogId]").off("change").on("change", function(e){
        e.preventDefault();
        if(DEBUG) console.log("Change on shippingTermCatalogId...");
        const shippingTermCatalogId = form.find("select[name=shippingTermCatalogId]").val();
        form.find("select[name=shippingTermId]").val("");
        form.find("select[name=shippingTermId]").find("option").hide();
        form.find("select[name=shippingTermId]").find("option[shippingTermCatalogId='"+shippingTermCatalogId+"']").show();        
    });
    form.find("#addItemBtn").off("click").on("click", function(e){
        e.preventDefault();
        if(DEBUG) console.log("Click on addItemBtn...");
        var clone = form.find(".itemRow:first-child").clone();
        clone.find("input").val("");
        clone.appendTo("#itemRows");
        form.keyup();
    });
    form.off("keyup change").on("keyup change", function(){
        if(DEBUG) console.log("Keyup or change on editContractForm...");
        refreshEditContractForm();
        // Save form
        btn.prop("disabled", false);
        clearTimeout(editContractTimeout);
        editContractTimeout = setTimeout(() => {
            btn.trigger('click');
        }, 2000);
    });

    form.off("click").on("click", function(e){
      if(DEBUG) console.log("Click on contractForm...");
      refreshEditContractForm();
      if($(e.target).closest(".removeItemBtn").length) {
        if(DEBUG) console.log("Click on removeItemBtn...");
        e.preventDefault();
        if(form.find(".itemRow").length>1) {
          $(e.target).closest(".itemRow").remove();
        }
      }
    });
    btn.off("click").on("click", async function(e) {
      e.preventDefault();
      if(DEBUG) console.log("Click on saveBtn...");
      btn.prop("disabled", true);
      contract.data = JSON.stringify(formToJson(form[0]));
      postContract(contract).then((contract) => {
        //const templateName = "viewContractTemplate";
        //document.querySelector('#myNavigator').replacePage(templateName, {data: {uid: uid}});
        //window.history.replaceState({page: templateName}, templateName);
      }).catch((error) => {
        btn.prop("disabled", false);
        showToast("Error saving contract on database.");
      });
   });
   refreshEditContractForm();
   content.show();
   progressCircular.hide();
   if(done) done();
   setTimeout(function(){
    introJs().setOption("dontShowAgain", true).start();
   }, 1000);
  }).catch((error) => {
    showToast("Error: "+error);
    if(done) done();
  });
}
function refreshEditContractForm() {
  if(DEBUG) console.log("Refresh editContractForm...");
  const pageElement = $("#editContractPage");
  const form = pageElement.find("#editContractForm");
   // productExportAlert
   var showProductExportAlert = false;
   form.find("input[name='itemCode[]']").each(function(){
       if($(this).val()=="XX" && form.find("select[name=buyerCountry]").val()=="IT") {
           showProductExportAlert = true;
       }
   });
   if(showProductExportAlert) {
      form.find("#productExportAlert").show();
   } else {
      form.find("#productExportAlert").hide();
   }
   // shippingDate
   var showShippingMaxDateAlert = false;
   if(form.find("input[name='shippingMinDate']").val()!=="" && form.find("input[name='shippingMaxDate']").val()!=="") {
      var shippingMinDate = moment(form.find("input[name='shippingMinDate']").val(), "YYYY-MM-DD", true);
      var shippingMaxDate = moment(form.find("input[name='shippingMaxDate']").val(), "YYYY-MM-DD", true);
      if(shippingMaxDate.isBefore(shippingMinDate)) {
        showShippingMaxDateAlert = true;
      }
   }
   if(showShippingMaxDateAlert) {
      form.find("#shippingMaxDateAlert").show();
   } else {
      form.find("#shippingMaxDateAlert").hide();
   }
   // items and amount
   var amount = 0;
   form.find(".itemRow").each(function(){
      $(this).find("[data-toggle=collapse]").attr("href", "#collapseItem"+$(this).index());
      $(this).find(".collapse").attr("id", "collapseItem"+$(this).index());
      // itemName
     if($(this).find("input[name='itemDescription[]']").val()!=="") {
       $(this).find(".itemName").text($(this).find("input[name='itemDescription[]']").val());
     } else {
       $(this).find(".itemName").text(i18next.t("A1.Unnamed_product"));
     }
     // amount
     if($(this).find("input[name='itemQuantity[]']").val()!=="" && $(this).find("input[name='itemPrice[]']").val()!=="") {
       var itemQuantity = parseInt($(this).find("input[name='itemQuantity[]']").val());
       var itemPrice = parseFloat($(this).find("input[name='itemPrice[]']").val());
       var itemAmount = itemQuantity * itemPrice;
       $(this).find(".itemAmount").text(itemAmount.toFixed(2)+" €");
       amount += itemAmount;
     } else {
       $(this).find(".itemAmount").text("");
     }
   });
   form.find("input[name='amount']").val(amount);
   // A5
   form.find("#inspectionSurveyorDiv").toggle(form.find("select[name='inspectionSurveyorEnabled']").val()=="required");
   // A7
   form.find("#delayedPaymentDiv").toggle(form.find("input[name='payment']:checked").val()=="delayed");
   form.find("#prepaymentDiv").toggle(form.find("input[name='payment']:checked").val()=="prepayment");
   form.find("#paymentAgainstDocumentsDiv").toggle(form.find("input[name='payment']:checked").val()=="againstDocuments");
   form.find("#irrevocableDocumentaryCreditDiv").toggle(form.find("input[name='payment']:checked").val()=="irrevocableDocumentaryCredit");
   form.find("#irrevocableBankPaymentObligationDiv").toggle(form.find("input[name='payment']:checked").val()=="irrevocableBankPaymentObligation");
   form.find("#otherPaymentDiv").toggle(form.find("input[name='payment']:checked").val()=="other");
   // A8
   form.find("#otherDocumentDiv").toggle(form.find("input[name='otherDocument']").is(":checked"));
   // A10
   form.find("#lateDeliveryPenaltyDiv").toggle(form.find("input[name='lateDeliveryPenalty']").is(":checked"));
   form.find("#lateDeliverySellerResponsabilityDiv").toggle(form.find("input[name='lateDeliverySellerResponsabilityEnabled']").is(":checked"));
   // A11
   form.find("#sellerResponsabilityDiv").toggle(form.find("input[name='sellerResponsabilityEnabled']").is(":checked"));
   // A12
   form.find("#examinationPlaceOtherDiv").toggle(form.find("input[name='examinationPlace']:checked").val()=="other");
   // A13
   form.find("#warrantyPeriodAfterSignatureMonthsDiv").toggle(form.find("input[name='warrantyPeriod']:checked").val()=="afterSignature");
   form.find("#warrantyPeriodAfterDeliveryMonthsDiv").toggle(form.find("input[name='warrantyPeriod']:checked").val()=="afterDelivery");
   // A15
   form.find("#nonConformityLiabilityPercentageDiv").toggle(form.find("input[name='nonConformityLiabilityPercentageEnabled']").is(":checked"));
   form.find("#nonConformityLiabilityAmountDiv").toggle(form.find("input[name='nonConformityLiabilityAmountEnabled']").is(":checked"));
   // A17
   form.find("#disputeResolutionOtherDiv").toggle(form.find("select[name='disputeResolution']").val()=="other");
   form.find("#disputeResolutionLitigationDiv").toggle(form.find("select[name='disputeResolution']").val()=="litigation");
}
// viewContractPage
function initializeViewContractPage(page) {
	if(DEBUG) console.log("Initializing viewContractPage...");
	var pageElement = $("#"+page.id).localize();
  getViewContract(page.data.uid);
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getViewContract(page.data.uid, done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });
  pageElement.find("#editBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on editBtn...");
    const templateName = "editContractTemplate";
    document.querySelector('#myNavigator').pushPage(templateName, {data: {uid: page.data.uid}});
    window.history.pushState({page: templateName}, templateName);
  });
  pageElement.find("#shareBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on shareBtn...");
    const templateName = "shareContractTemplate";
    document.querySelector('#myNavigator').pushPage(templateName, {data: {uid: page.data.uid}});
    window.history.pushState({page: templateName}, templateName);
  });
  pageElement.find("#viewContractChangesBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on viewContractChangesBtn...");
    const templateName = "viewContractChangesTemplate";
    document.querySelector('#myNavigator').pushPage(templateName, {data: {uid: page.data.uid}});
    window.history.pushState({page: templateName}, templateName);
  });
}
function getViewContract(uid, done) {
	if(DEBUG) console.log("Getting contract...");
  var pageElement = $("#viewContractPage");
  var content = pageElement.find("#content");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();
  getContract(uid).then(async (contract) => {
      pageElement.find("#backToolbar").find(".center").removeAttr("data-i18n").text(contract.name);
      // switchSellerBuyerBtn
      if(process.env.NODE_ENV=="production") {
        pageElement.find("#switchSellerBuyerBtn").remove();
      } else {
        pageElement.find("#switchSellerBuyerBtn").off("click").on("click", function(){
          if(DEBUG) console.log("Click on switchSellerBuyerBtn...");
          var tmpSellerId = contract.sellerId;
          contract.sellerId = contract.buyerId;
          contract.buyerId = tmpSellerId;
          postContract(contract).then((contract) => {
            getViewContract(uid);
          });
        });
      }
      // Contract amount
      const data = JSON.parse(contract.data);
      const amount =  (data!==null && data.amount!==null) ? parseFloat(data.amount).toFixed(2) : 0;
      const currency =  (data!==null && data.currency!==null) ? data.currency : "EUR";
      const cryptoAmount = 20;
      const cryptoCurrency = "USDC";
      // Contract status
      pageElement.find(".statusDiv").hide();
      pageElement.find(".trackingDiv").find(".step").removeClass("done").removeClass("active");
      if(contract.status=="draft") {
        pageElement.find(".statusDiv#draft").show();
        pageElement.find(".trackingDiv").find(".step#draft").addClass("done").addClass("active");
        pageElement.find("#storeContractBtn").off("click").on("click", function(){
          if(DEBUG) console.log("Click on storeContractBtn...");
          storeContract(uid);
        });
        pageElement.find("#editBtn").prop("disabled", false);
      } else if(contract.status=="stored") {
        pageElement.find(".statusDiv#stored").show();
        pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
        pageElement.find(".trackingDiv").find(".step#stored").addClass("done").addClass("active");
        if(contract.sellerId==getCookie("principal") && contract.sellerSignature!==null) {
          pageElement.find("#signContractBtn").prop("disabled", true);
        } else if(contract.buyerId==getCookie("principal") && contract.buyerSignature!==null) {
          pageElement.find("#signContractBtn").prop("disabled", true);
        }
        pageElement.find("#signContractBtn").off("click").on("click", function(){
          if(DEBUG) console.log("Click on signContractBtn...");
          signContract(uid);
        });
      } else if(contract.status=="signed") {
        pageElement.find(".statusDiv#signed").show();
        pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
        pageElement.find(".trackingDiv").find(".step#stored").addClass("done");
        pageElement.find(".trackingDiv").find(".step#signed").addClass("done").addClass("active");
        // Adjust payContractBtn
        const transakParams = new URLSearchParams({
          apiKey: TRANSAK_API_KEY,
          redirectURL: window.location.href,
          productsAvailed: "BUY",
          countryCode: "IT",
          fiatAmount: amount,
          fiatCurrency: currency,
          defaultFiatAmount: amount,
          defaultFiatCurrency: currency,
          network: "ethereum",
          defaultNetwork: "ethereum",
          defaultCryptoCurrency: "USDC",
          cryptoCurrencyCode: "USDC",
          //walletAddress: "0x711f3badae016a78c6d8137cbb4300b8eafada8b", // metamask Massimo ios
          walletAddress: "0x262f0DB57d0D64C42A8CBb47A7a922da057501fE", // address canister 
          disableWalletAddressForm: true,
          partnerOrderId: contract.uid,
          partnerCustomerId: contract.buyerId,
          colorMode: "DARK",
          themeColor: "30f6a8",
          defaultPaymentMethod: "credit_debit_card",
          isAutoFillUserData: true,
        }).toString();
        const principal = getCookie("principal");
        const account = await getAccount(principal);
        const transakUserData = encodeURIComponent(JSON.stringify({
          firstName: account.name,
          lastName: account.surname,
          email: account.email,
          mobileNumber: account.phone,
          dob: account.birthdate,
          address: {
            addressLine1: account.street,
            addressLine2: '',
            city: account.city,
            state: account.region,
            postCode: account.postalCode,
            countryCode: account.country,
          }
        }));
        var transakURL = TRANSAK_API_URL + "?" + transakParams + "&userData="+transakUserData;
        if(DEBUG) console.log("Transak URL: "+transakURL);
        pageElement.find("#payContractBtn").off("click").on("click", function(){
          if(DEBUG) console.log("Click on payContractBtn...");
          if(contract.sellerId==getCookie("principal")) {
            showToast("This action must be done by buyer.");
          } else if(contract.buyerId==getCookie("principal")) {
            if(amount>0) {
              window.open(transakURL, "_blank");
            } else {
              showToast("Amount not defined.");
            }
          }
        });
        // Add test card alert
        const testCardOnRampAlert = pageElement.find("#testCardOnRampAlert");
        if(process.env.NODE_ENV=="production") {
          testCardOnRampAlert.remove();
        } else {
          testCardOnRampAlert.find("#copyTestCardNumberBtn").off("click").on("click", function(e){
            e.preventDefault();
            if(DEBUG) console.log("Copy test card number to clipboard");
            const textToCopy = testCardOnRampAlert.find("#testCardNumber").text();
            navigator.clipboard.writeText(textToCopy).then(() => {
                if(DEBUG) console.log("Text copied into clipboard");
            }).catch(err => {
              if(DEBUG) console.error("Error copying text into clipboard", err);
            });
            testCardOnRampAlert.find("#testCardNumber").tooltip('show');
            setTimeout(function(){
              testCardOnRampAlert.tooltip('hide');
            }, 2000);
          });
        }
      } else if(contract.status=="paid") {
          pageElement.find(".statusDiv#paid").show();
          pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
          pageElement.find(".trackingDiv").find(".step#stored").addClass("done");
          pageElement.find(".trackingDiv").find(".step#signed").addClass("done");
          pageElement.find(".trackingDiv").find(".step#paid").addClass("done").addClass("active");
          // Adjust shipGoodsBtn
          pageElement.find("#shipGoodsBtn").off("click").on("click", function(){
            if(DEBUG) console.log("Click on shipGoodsBtn...");
            if(contract.sellerId!==getCookie("principal")) {
              showToast("This action must be done by seller.");
              return;
            }
            var form = pageElement.find("#shipGoodsForm");
            if(form[0].checkValidity() === false) {
              form.addClass('was-validated');
              return;
            }
            const btn = $(this);
            btn.prop("disabled", true);
            contract.status = "shipped";
            contract.shipped = Math.floor(Date.now()/1000);
            contract.courierCode = pageElement.find("select[name=courierCode]").val() || null;
            contract.trackingNumber = pageElement.find("input[name=trackingNumber]").val() || null;
            postContract(contract).then((contract) => {
              getViewContract(uid);
            }).catch((error) => {
              showToast("Error saving contract on database.");
              btn.prop("disabled", true);
            });
          });
      } else if(contract.status=="shipped") {
          pageElement.find(".statusDiv#shipped").show();
          pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
          pageElement.find(".trackingDiv").find(".step#stored").addClass("done");
          pageElement.find(".trackingDiv").find(".step#signed").addClass("done");
          pageElement.find(".trackingDiv").find(".step#paid").addClass("done");
          pageElement.find(".trackingDiv").find(".step#shipped").addClass("done").addClass("active");
      } else if(contract.status=="delivered") {
          pageElement.find(".statusDiv#delivered").show();
          pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
          pageElement.find(".trackingDiv").find(".step#stored").addClass("done");
          pageElement.find(".trackingDiv").find(".step#signed").addClass("done");
          pageElement.find(".trackingDiv").find(".step#paid").addClass("done");
          pageElement.find(".trackingDiv").find(".step#shipped").addClass("done");
          pageElement.find(".trackingDiv").find(".step#delivered").addClass("done").addClass("active");
          // Adjust getMoneyBtn
          const transakParams = new URLSearchParams({
            apiKey: TRANSAK_API_KEY,
            redirectURL: window.location.href,
            productsAvailed: "SELL",
            countryCode: "IT",
            walletRedirection: true,
            cryptoAmount: cryptoAmount,
            cryptoCurrency: cryptoCurrency,
            defaultCryptoAmount: cryptoAmount,
            defaultCryptoCurrency: cryptoCurrency,
            fiatCurrency: currency,
            defaultFiatCurrency: currency,
            partnerOrderId: contract.uid,
            partnerCustomerId: contract.buyerId,
            colorMode: "DARK",
            themeColor: "30f6a8",
            defaultPaymentMethod: "credit_debit_card",
            isAutoFillUserData: true,
          }).toString();
          const principal = getCookie("principal");
          const account = await getAccount(principal);
          const transakUserData = encodeURIComponent(JSON.stringify({
            firstName: account.name,
            lastName: account.surname,
            email: account.email,
            mobileNumber: account.phone,
            dob: account.birthdate,
            address: {
              addressLine1: account.street,
              addressLine2: '',
              city: account.city,
              state: account.region,
              postCode: account.postalCode,
              countryCode: account.country,
            }
          }));
          var transakURL = TRANSAK_API_URL + "?" + transakParams + "&userData="+transakUserData;
          if(DEBUG) console.log("Transak URL: "+transakURL);
          pageElement.find("#getMoneyBtn").off("click").on("click", function(){
          if(DEBUG) console.log("Click on getMoneyBtn...");
          if(contract.buyerId==getCookie("principal")) {
            showToast("This action must be done by seller.");
          } else if(contract.sellerId==getCookie("principal")) {
            if(cryptoAmount>0) {
              window.open(transakURL, "_blank");
            } else {
              showToast("Amount not defined.");
            }
          }
        });
        // Add test card alert
        const testCardOffRampAlert = pageElement.find("#testCardOffRampAlert");
        if(process.env.NODE_ENV=="production") {
          testCardOffRampAlert.remove();
        } else {
          testCardOffRampAlert.find("#copyTestCardNumberBtn").off("click").on("click", function(e){
            e.preventDefault();
            if(DEBUG) console.log("Copy test card number to clipboard");
            const textToCopy = testCardOffRampAlert.find("#testCardNumber").text();
            navigator.clipboard.writeText(textToCopy).then(() => {
                if(DEBUG) console.log("Text copied into clipboard");
            }).catch(err => {
              if(DEBUG) console.error("Error copying text into clipboard", err);
            });
            testCardOffRampAlert.find("#testCardNumber").tooltip('show');
            setTimeout(function(){
              testCardOffRampAlert.tooltip('hide');
            }, 2000);
          });
        }
      } else if(contract.status=="completed") {
        pageElement.find(".statusDiv#completed").show();
        pageElement.find(".trackingDiv").find(".step#draft").addClass("done");
        pageElement.find(".trackingDiv").find(".step#stored").addClass("done");
        pageElement.find(".trackingDiv").find(".step#signed").addClass("done");
        pageElement.find(".trackingDiv").find(".step#paid").addClass("done");
        pageElement.find(".trackingDiv").find(".step#shipped").addClass("done");
        pageElement.find(".trackingDiv").find(".step#delivered").addClass("done");
        pageElement.find(".trackingDiv").find(".step#completed").addClass("done");
      }
      // Shipping status
      if((contract.status=="shipped" || contract.status=="delivered" || contract.status=="completed") && contract.shippingInfo!==null) {
        pageElement.find(".shippingStatusDiv").find("#courierCode").text(contract.courierCode);
        pageElement.find(".shippingStatusDiv").find("#trackingNumber").text(contract.trackingNumber);
        pageElement.find("#shippingStatus").empty();
        if(typeof contract.shippingInfo!=='undefined' && contract.shippingInfo!=null) {
          contract.shippingInfo.origin_info.trackinfo.forEach(trackInfo => {
            var html = "";
            html += "<div class='list-group-item checkpoint'>";
            html += "<div class='time'>"+moment(trackInfo.checkpoint_date).format('llll')+"</div>";
            html += "<div class='details'>"+trackInfo.tracking_detail+"</div>";
            html += "</div>";
            pageElement.find("#shippingStatus").append(html);
          });
          pageElement.find("#shippingStatusDiv").show();
        } else {
          pageElement.find("#shippingStatusDiv").hide();
        }
      } else {
        pageElement.find("#shippingStatusDiv").hide();
      }
      // Payment status
      var buyerPaidAmount = 0;
      var sellerReceivedAmount = 0;
      if(contract.payments.length>0) {
        contract.payments.forEach(payment => {
          if(payment.status=="COMPLETED") {
            if(payment.isBuyOrSell=="BUY") {
              buyerPaidAmount += parseFloat(payment.fiatAmount);
            } else if(payment.isBuyOrSell=="SELL") {
              sellerReceivedAmount += parseFloat(payment.fiatAmount);
            }
          }
        });
      }
      pageElement.find(".paymentStatusDiv").find(".step#buyer").find(".amount").text(amount-buyerPaidAmount+" €");
      pageElement.find(".paymentStatusDiv").find(".step#contract").find(".amount").text(buyerPaidAmount+" €");
      pageElement.find(".paymentStatusDiv").find(".step#seller").find(".amount").text(sellerReceivedAmount+" €");
      if(contract.status==null || contract.status=="stored") {
        pageElement.find(".paymentStatusDiv").find(".step#buyer").addClass("done").addClass("active");
      } else if(contract.status=="signed" || contract.status=="paid" || contract.status=="shipped" || contract.status=="delivered") {
        pageElement.find(".paymentStatusDiv").find(".step#buyer").addClass("done");
        pageElement.find(".paymentStatusDiv").find(".step#contract").addClass("done").addClass("active");
      } else if(contract.status=="completed") {
        pageElement.find(".paymentStatusDiv").find(".step#buyer").addClass("done");
        pageElement.find(".paymentStatusDiv").find(".step#contract").addClass("done");
        pageElement.find(".paymentStatusDiv").find(".step#seller").addClass("done");
      }
      // Payments
      pageElement.find("#payments").empty();
      if(contract.payments.length>0) {
        contract.payments.forEach(payment => {
          if(payment.isBuyOrSell=="BUY") {
            var paymentHtml = "";
            paymentHtml += "<div class='list-group-item payment'>";
            paymentHtml += "<div class='time'>"+moment(payment.created*1000).format('lll')+"</div>";
            paymentHtml += "<div class='idInfo'><b data-i18n='viewContractPage.Transaction_id'></b>: "+payment.id+"</div>";
            paymentHtml += "<div class='amountInfo'><b data-i18n='viewContractPage.Transaction_amount'></b>: "+payment.fiatAmount+" "+payment.fiatCurrency+" ("+payment.cryptoAmount+" "+payment.cryptoCurrency+")</div>";
            paymentHtml += "<div class='feeInfo'><b data-i18n='viewContractPage.Transaction_fee'></b>: "+payment.totalFeeInFiat+" "+payment.fiatCurrency+"</div>";
            paymentHtml += "<div class='badge badge-pill status "+payment.status+"' data-i18n='paymentStatus."+payment.status+"'></div>";
            paymentHtml += "</div>";
            pageElement.find("#payments").append(paymentHtml).localize();
          }
        });
      }
      if(pageElement.find(".paymentsDiv").find(".payment").length==0) {
        pageElement.find(".paymentsDiv").hide();
      }
      // Withdrawals
      pageElement.find("#withdrawals").empty();
      if(contract.payments.length>0) {
        contract.payments.forEach(payment => {
          if(payment.isBuyOrSell=="SELL") {
            var paymentHtml = "";
            paymentHtml += "<div class='list-group-item withdrawal'>";
            paymentHtml += "<div class='time'>"+moment(payment.created*1000).format('lll')+"</div>";
            paymentHtml += "<div class='idInfo'><b data-i18n='viewContractPage.Transaction_id'></b>: "+payment.id+"</div>";
            paymentHtml += "<div class='amountInfo'><b data-i18n='viewContractPage.Transaction_amount'></b>: "+payment.fiatAmount+" "+payment.fiatCurrency+" ("+payment.cryptoAmount+" "+payment.cryptoCurrency+")</div>";
            paymentHtml += "<div class='feeInfo'><b data-i18n='viewContractPage.Transaction_fee'></b>: "+payment.totalFeeInFiat+" "+payment.fiatCurrency+"</div>";
            paymentHtml += "<div class='badge badge-pill status "+payment.status+"' data-i18n='paymentStatus."+payment.status+"'></div>";
            paymentHtml += "</div>";
            pageElement.find("#withdrawals").append(paymentHtml).localize();
          }
        });
      }
      if(pageElement.find(".withdrawalsDiv").find(".withdrawal").length==0) {
        pageElement.find(".withdrawalsDiv").hide();
      }
      // Contract details
      pageElement.find("#uid").text(contract.uid);
      pageElement.find("#name").text(contract.name);
      pageElement.find("#model").text("ICC");
      pageElement.find("#amount").text(amount+" €");
      if(contract.sellerId!==null) {
        pageElement.find("#sellerId").text(contract.sellerId);
      } else {
        pageElement.find("#sellerId").text("-");
      }
      if(contract.buyerId!==null) {
        pageElement.find("#buyerId").text(contract.buyerId);
      } else {
        pageElement.find("#buyerId").text("-");
      }
      if(contract.sellerSignature!==null) {
        pageElement.find("#sellerSignature").text(moment(contract.sellerSignature*1000).format('llll'));
      }
      if(contract.buyerSignature!==null) {
        pageElement.find("#buyerSignature").text(moment(contract.buyerSignature*1000).format('llll'));
      }
      if(contract.id!==null) {
        pageElement.find("#id").text(contract.id);
        pageElement.find("#verifyLink").show();
      } else {
        pageElement.find("#verifyLink").hide();
      }
      // PDF btn
      pageElement.find("#openPdfBtn").off("click").on("click", function(){
        if(DEBUG) console.log("Click on openPdfBtn...");
        window.open(API_URL+"/api/v1/contracts/"+uid+"/pdf?lang="+LANG, "_blank");
      });
      content.show();
      progressCircular.hide();
      if(done) done();
  }).catch((error) => {
    if(DEBUG) console.error('Error:', error);
    showToast("Error");
    if(done) done();
  });
}
async function storeContract(uid) {
  if(DEBUG) console.log("Storing contract...");
  var pageElement = $("#viewContractPage");
  var btn = pageElement.find("#storeContractBtn");
  btn.prop("disabled", true);

  getContract(uid).then(async (contract) => {

    if(contract.sellerId==null) {
      showToast("Seller not defined.");
      btn.prop("disabled", false);
      return;
    }

    if(contract.buyerId==null) {
      showToast("Buyer not defined.");
      btn.prop("disabled", false);
      return;
    }

    const publicKeyBase64 = fs.readFileSync('./.keys/public.key', 'utf8');
    const publicKey = await importPublicKey(publicKeyBase64);
    const CONTRACT_JSON = await encryptLargeJSON(contract.data, publicKey);
    const SELLER_PRINCIPAL = contract.sellerId;
    const BUYER_PRINCIPAL = contract.buyerId;
    const backendCanister  = createActor(CANISTER_ID, { agentOptions:{host: DFX_NETWORK}}); //, identity: }});
    await backendCanister
      .create_contract(JSON.stringify(CONTRACT_JSON), Principal.fromText(BUYER_PRINCIPAL), Principal.fromText(SELLER_PRINCIPAL))
      .then(function(result){
        console.log("Contract stored on ICP chain. uid: "+result);
        // Save id on database
        contract.id = result;
        contract.status = "stored";
        contract.stored = Math.floor(Date.now()/1000);
        postContract(contract).then((contract) => {
          getViewContract(uid);
          getViewAccount();
        });
      }).catch(function(e){
        console.error("Error storing contract on ICP chain.", e);
        btn.prop("disabled", false);
      });
  }).catch((error) => {
    console.error('Error getting contract from db:', error);
    showToast("Error");
  });
}
async function signContract(uid) {
  if(DEBUG) console.log("Sign contract...");
  var pageElement = $("#viewContractPage");
  var btn = pageElement.find("#signContractBtn");
  btn.prop("disabled", true);

  const authClient = await AuthClient.create();
  const identity = await authClient.getIdentity();
  const principal = authClient.getIdentity().getPrincipal().toText();
  
  getContract(uid).then(async (contract) => {
    const backendCanister  = createActor(CANISTER_ID, { agentOptions:{host: DFX_NETWORK, identity: identity} });
    await backendCanister
      .sign_contract(contract.id)
      .then(function(result){
        const time = Math.floor(Date.now()/1000);
        if(principal==contract.sellerId) {
          contract.sellerSignature = time;
        } else if(principal==contract.buyerId) {
          contract.buyerSignature = time;
        }
        if(contract.sellerSignature!==null && contract.buyerSignature!==null) {
          contract.status = "signed";
          contract.signed = time;
        }
        postContract(contract).then((contract) => {
          getViewContract(uid);
          getViewAccount();
        }).catch((error) => {
          console.error('Error posting contract:', error);
          btn.prop("disabled", false);
          showToast("Error");
        });
      })
      .catch(function(e){
        console.log("catch", e);
        showToast("Error signing contract on ICP chain.");
        btn.prop("disabled", false);
      });
  }).catch((error) => {
    console.error('Error getting contract:', error);
    btn.prop("disabled", false);
    showToast("Error");
  });
  
}
// viewContractChangesPage
function initializeViewContractChangesPage(page) {
	if(DEBUG) console.log("Initializing viewContractChangesPage...");
	var pageElement = $("#"+page.id).localize();
  getViewContractChanges(page.data.uid);
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getViewContractChanges(page.data.uid, done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });
}
function getViewContractChanges(uid, done) {
	if(DEBUG) console.log("Getting contractChanges...");
  var pageElement = $("#viewContractChangesPage");
  var content = pageElement.find("#content");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();
  getContractChanges(uid).then((contractChanges) => {
    console.log(contractChanges);
      content.find("#contractChangesListGroup").empty();
      var contractChangeGroupId = null;
      contractChanges.forEach(contractChange => {
        if(contractChangeGroupId!==contractChange.created) {
          contractChangeGroupId = contractChange.created;
          var role = (contractChange.contractRole=="seller") ? "Venditore" : "Compratore";
          var html = "";
          html += "<div class='expansion-panel list-group-item contractChangeGroup'>";
          html += "<a class='expansion-panel-toggler collapsed' data-toggle='collapse' href='#collapse"+contractChangeGroupId+"'>";
          html += "<div>";
          html += "<div class='who'>"+role+"</div>";
          html += "<div class='when'>"+moment(contractChange.created*1000).format("llll")+"</div>";
          html += "</div>";
          html += "<div class='expansion-panel-icon ml-3 text-black-secondary'>";
          html += "<i class='collapsed-show material-icons'>keyboard_arrow_down</i>";
          html += "<i class='collapsed-hide material-icons'>keyboard_arrow_up</i>";
          html += "</div>";
          html += "</a>";
          html += "<div class='collapse' id='collapse"+contractChangeGroupId+"'>";
          html += "<div class='expansion-panel-body'>";
          html += "</div>";
          html += "</div>";
          html += "</div>";
          content.find("#contractChangesListGroup").append(html);
        }
        var html = "";
        html += "<div class='list-group-item contractChange'>";
        if(contractChange.oldValue=="") {
          html += "<div>Valorizzazione del campo <span class='fieldName'>"+contractChange.fieldName+"</span></div>";
          html += "<div><span class='newValue'>"+contractChange.newValue+"</span></div>";
        } else if(contractChange.newValue=="") {
          html += "<div>Azzeramento del campo <span class='fieldName'>"+contractChange.fieldName+"</span></div>";
          html += "<div><span class='oldValue'>"+contractChange.oldValue+"</span></div>";
        } else {
          html += "Modifica del campo <span class='fieldName'>"+contractChange.fieldName+"</span>";
          html += "<div><span class='oldValue'>"+contractChange.oldValue+"</span> -> <span class='newValue'>"+contractChange.newValue+"</span></div>";
        }
        html +=  "</div>";
        content.find("#contractChangesListGroup").find("#collapse"+contractChangeGroupId).find(".expansion-panel-body").append(html);
      });

      content.show();
      progressCircular.hide();
      if(done) done();
  }).catch((error) => {
    if(DEBUG) console.error('Error:', error);
    showToast("Error");
    if(done) done();
  });
}
// shareContractPage
function initializeShareContractPage(page) {
	if(DEBUG) console.log("Initializing shareContractPage...");
	var pageElement = $("#"+page.id).localize();
  getShareContract(page.data.uid);
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getShareContract(page.data.uid, done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });
}
function getShareContract(uid, done) {
	if(DEBUG) console.log("Getting shareContract...");
  var pageElement = $("#shareContractPage");
  var content = pageElement.find("#content");
  var progressCircular = pageElement.find("#progressCircular");
  content.hide();
  progressCircular.show();

  const shareContractUrl = APP_URL+"?sharedContract="+uid;
  pageElement.find("#url").val(shareContractUrl);
  pageElement.find("#qrcode").find("img").attr("src", API_URL+"/api/v1/qrcode?text="+encodeURI(shareContractUrl));
  
  const form = pageElement.find("#shareContractForm");
  form.find("#shareBtn").off("click").on("click", function(e){
		if(DEBUG) console.log("Click on shareBtn...");
		e.preventDefault();
		const shareMsg = form.find("#message").val();
		const shareUrl = form.find("#url").val();
		if(navigator.share) {
			navigator.share({
				text: shareMsg,
				url: shareUrl
			}).then(function(){
				if(DEBUG) console.log('Successful share');
			}).catch(function(error){
				if(DEBUG) console.error("Error sharing", error);
			});
		} else {
			navigator.clipboard.writeText(shareMsg+shareUrl);
			showToast("I dati per la condivisione sono stati copiati negli appunti, incollali dove preferisci.");
		}
	});
	pageElement.find("#copyBtn").off("click").on("click", function(e){
		e.preventDefault();
		if(DEBUG) console.log("Copy password to clipboard");
		/* Get the text field */
		var copyText = document.getElementById("url");  
		/* Select the text field */
		copyText.select();
		copyText.setSelectionRange(0, 99999); /*For mobile devices*/
		/* Copy the text inside the text field */
		document.execCommand("copy");
		pageElement.find("#url").tooltip('show');
    setTimeout(function(){
      pageElement.find("#url").tooltip('hide');
    }, 2000);
		$(this).prop("disabled", true);
	});
  content.show();
  progressCircular.hide();
  if(done) done();
}
// addContractPage
function initializeAddContractPage(page) {
	if(DEBUG) console.log("Initializing addContractPage...");
	var pageElement = $("#"+page.id).localize();
  var dialogElement = pageElement.closest("ons-dialog");
  var uid = dialogElement.attr("data-uid");
  getAddContract(uid);
  pageElement.find("#backBtn, #cancelBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    if(dialogElement.length) {
      dialogElement[0].hide().then(function() {
        if(DEBUG) console.log("Removing opened dialog...");
        dialogOpened[0].remove();
      });
    }
  });
}
function getAddContract(uid, done) {
	if(DEBUG) console.log("Getting addContract...");
  var pageElement = $("#addContractPage");
  var content = pageElement.find("#content");
  content.hide();

  getContract(uid).then((contract) => {
    if(DEBUG) console.info('Success');
      content.show();
      if(done) done();
      pageElement.find("#name").text(contract.name);

      pageElement.find("#addBtn").off("click").on("click", function(){
        if(DEBUG) console.log("Click on addBtn...");
        const time = Math.floor(Date.now()/1000);
        const principal = getCookie("principal");
        if(contract.sellerId==null) {
          contract.sellerId = principal;
        } else if(contract.buyerId==null) {
          contract.buyerId = principal;
        } else {
          showToast("Error: buyer and seller are already assigned to this contract.");
          return;
        }
        contract.updatedBy = principal;
        contract.updated = time;
        addContract(contract);
      });
  }).catch((error) => {
    if(DEBUG) console.error('Error:', error);
    showToast("Error");
  });
}
function addContract(contract) {
	if(DEBUG) console.log("Adding contract...");
  var pageElement = $("#addContractPage");
  postContract(contract).then((contract) => {
    pageElement.find("#backBtn").trigger("click");
    getViewAccount();
    // Reset url
    const templateName = "accountPage";
    const pageUrl = "https://"+window.location.host;
    window.history.replaceState({page: templateName}, templateName, pageUrl);
  }).catch((error) => {
    if(DEBUG) console.error('Error:', error);
    showToast("Error");
  });
}
// adminPage
function initializeAdminPage(page) {
	if(DEBUG) console.log("Initializing adminPage...");
	var pageElement = $("#"+page.id).localize();
  getAdmin();
  var pullHook = page.querySelector('[id=pullHook]');
  pullHook.addEventListener('changestate', onPullHookChangeState);
  pullHook.onAction = function(done) {
    getAdmin(done);
  };
  pageElement.find("#backBtn").off("click").on("click", function(){
    if(DEBUG) console.log("Click on backBtn...");
    document.querySelector('#myNavigator').popPage();
  });
}
async function getAdmin(done) {
  if(DEBUG) console.log("Getting admin info...");
  var page = $("#adminPage");
  var content = page.find("#content");
  var progressCircular = page.find("#progressCircular");
  content.hide();
  progressCircular.show();

	const authClient = await AuthClient.create();
  const identity = authClient.getIdentity();
  const backendCanister = createActor(CANISTER_ID, { agentOptions:{host: DFX_NETWORK, identity: identity}});
  
  backendCanister
  .get_balance()
  .then(function(result){
    console.log("Balance on Sepolia chain: ", result);
    console.log(JSON.stringify(result.Ok));
    const balanceWei = BigInt(result.Ok);
    const balanceETH = fromWeiBigInt(balanceWei, 18);
    content.find(".KPI#ETH").attr("title", balanceWei);
    content.find(".KPI#ETH").tooltip();
    content.find("#balanceETH").text(balanceETH);
  }).catch(function(e){
    console.error("Error getting balance on Sepolia chain.", e);
  });


  backendCanister
  .get_balance_usdc()
  .then(function(result){
    console.log("Balance on Sepolia chain: ", result);
    console.log(JSON.stringify(result.Ok));
    const balanceWei = BigInt(result.Ok);
    const balanceUSDC = fromWeiBigInt(balanceWei, 18);
    content.find(".KPI#USDC").attr("title", balanceWei);
    content.find(".KPI#USDC").tooltip();
    content.find("#balanceUSDC").text(balanceUSDC);

  }).catch(function(e){
    console.error("Error getting balance on Sepolia chain.", e);
  });


  backendCanister
  .get_address()
  .then(function(result){
    console.log("Address ", result);
    if(Object.keys(result)[0]=="Ok") {
      content.find("#canisterWalletAddress").text(Object.values(result)[0]);
    } else {
      showToast("Error getting address.");
    }
  }).catch(function(e){
    console.error("Error getting address.", e);
  });


  backendCanister
  .get_users()
  .then(function(result){
    console.log("Users ", result);
    content.find("#userList").empty();
    result.forEach(user => {
      var html = "";
      html += "<div class='list-group-item user'>";
      html += "<div class='row'>";
      html += "<div class='col-8'>"+Principal.fromUint8Array(user[0]._arr).toText()+"</div>";
      html += "<div class='col-4'>"+Object.keys(user[1].role)[0]+"</div>";
      html += "</div>";
      html += "</div>";
      content.find("#userList").append(html);
    });
  }).catch(function(e){
    console.error("Error getting users.", e);
  });

  content.show();
  progressCircular.hide();
  if(done) done();
}
function fromWeiBigInt(weiValue, decimals = 18) {
  const factor = 10n ** BigInt(decimals);
  const intPart = BigInt(weiValue) / factor; // Parte intera
  const decimalPart = (BigInt(weiValue) % factor) * 100n / factor; // Due cifre decimali
  return `${intPart}.${decimalPart.toString().padStart(2, '0')}`;
}

// DB API
function getAccount(uidOrPrincipal) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/accounts/'+uidOrPrincipal;
    axios.get(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      if(response.data!==null) {
        resolve(response.data);
      } else {
        reject();
      }
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    }); 
});
}
function postAccount(requestBody) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/accounts';
    axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      resolve(response);
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    });
});
}
function getContracts(principal) {
  return new Promise((resolve, reject) => { 
    const url = API_URL+'/api/v1/contracts?principal='+principal;
    axios.get(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      resolve(response.data.data);
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    }); 
});
}
function getContract(uid) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/contracts/'+uid;
    axios.get(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      if(response.data!==null) {
        resolve(response.data);
      } else {
        reject();
      }
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    }); 
});
}
function getContractChanges(uid) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/contracts/'+uid+"/changes";
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      if(response.data!==null) {
        resolve(response.data);
      } else {
        reject();
      }
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    });
});
}
function postContract(requestBody) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/contracts';
    axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      resolve(response.data);
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    });
});
} 
function deleteContract(uid) {
  return new Promise((resolve, reject) => {
    const url = API_URL+'/api/v1/contracts/'+uid;
    axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(DEBUG) console.log('Response:', response.data);
      if(response.data!==null) {
        const contract = response.data;
        resolve(contract);
      } else {
        reject();
      }
    }).catch(error => {
      if(DEBUG) console.error('Error:', error);
      reject(error);
    }); 
  });
}



// Utilities
function formToJson(form) {
  const formData = new FormData(form);
  const jsonObject = {};

  // Itera su tutti i campi del form
  formData.forEach((value, key) => {
    // Se il campo esiste già come chiave (es. checkbox con lo stesso name), crea un array
    if (jsonObject[key]) {
      if (!Array.isArray(jsonObject[key])) {
        jsonObject[key] = [jsonObject[key]];
      }
      jsonObject[key].push(value);
    } else {
      jsonObject[key] = value;
    }
  });

  return jsonObject;
}
function jsonToForm(json, form) {
  Object.keys(json).forEach(key => {
    const field = form.querySelector(`[name=${key}]`);

    // Verifica se il campo esiste nel form
    if (field) {
      field.value = json[key];
    }
  });
}

// Encryption functions
async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
      {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
  );
  return keyPair;
}
async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return Buffer.from(exported).toString("base64");  // Converte in base64 per memorizzazione
}
async function exportPrivateKey(privateKey) {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  return Buffer.from(exported).toString("base64");  // Converte in base64 per memorizzazione
}
async function importPublicKey(publicKeyBase64) {
  const binary = Buffer.from(publicKeyBase64, "base64");
  return crypto.subtle.importKey(
      "spki",
      binary,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
  );
}
async function importPrivateKey(privateKeyBase64) {
  const binary = Buffer.from(privateKeyBase64, "base64");
  return crypto.subtle.importKey(
      "pkcs8",
      binary,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
  );
}
async function encryptLargeJSON(jsonData, publicKey) {
  // Step 1: Convert JSON to string and then to ArrayBuffer
  const jsonString = JSON.stringify(jsonData);
  const enc = new TextEncoder();
  const encodedData = enc.encode(jsonString);

  // Step 2: Generate AES Key
  const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
  );

  // Step 3: Encrypt JSON data with AES
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encodedData
  );

  // Step 4: Export and Encrypt AES Key with RSA public key
  const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      exportedAesKey
  );

  // Step 5: Encode results in base64 for easy transmission
  return {
      encryptedData: Buffer.from(encryptedData).toString("base64"),
      encryptedKey: Buffer.from(encryptedAesKey).toString("base64"),
      iv: Buffer.from(iv).toString("base64")
  };
}
async function decryptLargeJSON(encryptedObject, privateKey) {
  const { encryptedData, encryptedKey, iv } = encryptedObject;

  // Step 1: Decode Base64 values
  const encryptedDataBuffer = Buffer.from(encryptedData, "base64");
  const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64");
  const ivBuffer = Buffer.from(iv, "base64");

  // Step 2: Decrypt AES Key with RSA private key
  const aesKeyRaw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBuffer
  );
  const aesKey = await crypto.subtle.importKey(
      "raw",
      aesKeyRaw,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
  );

  // Step 3: Decrypt JSON data with AES
  const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      aesKey,
      encryptedDataBuffer
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedData));
}