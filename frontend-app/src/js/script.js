import $ from 'jquery';
import i18next from 'i18next';
import i18nextJquery from 'jquery-i18next';
import moment from 'moment-timezone/builds/moment-timezone-with-data-10-year-range.min.js';
import 'popper.js/dist/popper.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'daemonite-material/css/material.min.css';
import 'daemonite-material/js/material.min.js';
import "flag-icon-css/css/flag-icons.min.css";
import "onsenui/css/onsenui.min.css";
import "onsenui/css/onsen-css-components.min.css";
import "onsenui/js/onsenui.min.js";
import "intro.js/minified/introjs.min.css";
import "intro.js/minified/intro.min.js";

export const DEBUG = true;
export var LANG = null;

$(document).ready(async function() {
   
    initializeAppLanguage();
	  manageSplashScreen();
    managePWA();
    manageBackButton();
    
    $("#languageModal").find(".languageBtn").off("click").on("click", function(){
        if(DEBUG) console.log("Click on languageBtn...");
        var lang = $(this).attr("id");
        i18next.changeLanguage(lang);
        $("#languageModal").modal("hide");
    });
	
});


function initializeAppLanguage() {
  if(DEBUG) console.log("Initializing app language...");
  if(getParameterByName(window.location.href, "lang")) {
    LANG = getParameterByName(window.location.href, "lang");
  } else if(getCookie("lang")!==null) {
    LANG = getCookie("lang");
  } else {
    LANG = "en";
  }
  var languageCallback = function(lang) {
    if(DEBUG) console.log("Callback language");
    LANG = lang;
    setCookie("lang", LANG, 365);
    $("html").attr("lang", lang);
    $("body").localize();
    $(".modal").localize();
    $("#navdrawer").localize();
    // timezone
    moment.tz.setDefault("Europe/Rome");
    // locale
    moment.locale(LANG);
    // flag
    var flag = (LANG=="en") ? "gb" : LANG;
    $("[data-target='#languageModal']").find(".flag").removeClass(function(index, className) {
      return (className.match(/\bflag-icon-\S+/g) || []).join(' ');
    }).addClass("flag-icon-"+flag);
  }

  i18next.init({
        lng:  LANG,
        debug: DEBUG,
        fallbackLng: 'it',
        resources: {
            it: {
                translation: require('../locale/it/translation.json')
            },
            en: {
                translation: require('../locale/en/translation.json')
            }
        }
    }, function(err, t) {
        if(DEBUG) console.log("i18next initialized...");
        i18nextJquery.init(i18next, $, {
            tName: 't', // --> appends $.t = i18next.t
            i18nName: 'i18n', // --> appends $.i18n = i18next
            handleName: 'localize', // --> appends $(selector).localize(opts);
            selectorAttr: 'data-i18n', // selector for translating elements
            targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if different than itself)
            optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
            useOptionsAttr: false, // see optionsAttr
            parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
        });
    languageCallback(LANG);
    });
  i18next.on('languageChanged', function(lang){
    if(DEBUG) console.log("i18next languageChanged...");
    languageCallback(lang);
  });
}

var isIframe = false;
var isAndroid = false;
var isIOS = false;	
var isSafari = false;
var isStandalone = false;
function managePWA() {
	if(DEBUG) console.log("Managing PWA...");
	isIframe = (window.location!==window.parent.location) ? true : false;
	isAndroid = /android/i.test(navigator.userAgent);
	isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
	isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  var appTypeMatch = navigator.userAgent.match(/appType\/(ios|android)/);
	if(appTypeMatch) { // new version of userAgent
		appType = appTypeMatch[1];
		appVersionName = navigator.userAgent.match(/appVersionName\/(\d+\.\d+\.\d+|\d+\.\d+)/)[1];
		appVersionCode = navigator.userAgent.match(/appVersionCode\/(\d+)/)[1];
	} else if(getCookie("appType")=="android" || getCookie("appType")=="ios") { // legacy version with cookies (delete after a while)
		appType = getCookie("appType");
		appVersionName = getCookie("appVersionName");
		appVersionCode = getCookie("appVersionCode");
	} else if(navigator.standalone || isStandalone) {
		appType = "PWA";
		appVersionName = 1;
		appVersionCode = 1;
	} else {
		appType = "WebApp";
		appVersionName = 1;
		appVersionCode = 1;
	}
	// Set appType
	if(DEBUG) console.log("appType: "+appType);
	setCookie("appType", appType, 365);
	// if browser not ios
	if(appType!=='ios' && !isStandalone) {
		if(DEBUG) console.log("App is in browser, setting body height to innerHeight to avoid 100vh and consider navigation bar...");
		$(window).on("resize orientationchange", function(){
			if(DEBUG) console.log("Window resized...");
			//$("body").css("height", window.innerHeight);
			$("body").css("height", "100dvh");
		});
		$(window).resize();
	}
}

// SplashScreen
function manageSplashScreen(){
	if(DEBUG) console.log("Managing splashScreen...");
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
	if(!navigator.standalone && !isStandalone) {
		$("#splashScreen").find("#logo").show();
		setTimeout(function(){
			$("#splashScreen").remove();
		}, 1000);
	} else {
		$("#splashScreen").remove();
	}
}


// Manage back button
function manageBackButton(){
  if(DEBUG) console.log('Manage back button');
  window.onpopstate = function(e) {
    //if(DEBUG) alert("location: " + document.location + ", state: " + JSON.stringify(e.state));
    var modalOpened = $(".modal.show");
    if(modalOpened.length) {
      if(modalOpened.attr("data-backdrop")=="static") {
        return false;
      }
      modalOpened.modal("hide");
      return false;
    }
    var dialogOpened = $("ons-dialog:visible");		
    if(dialogOpened.length) {
      if(dialogOpened.find("#backBtn").prop("disabled")) {
        return false;
      }
      var dialog = dialogOpened[0];
		  dialog.hide().then(function() {
			  if(DEBUG) console.log("Removing opened dialog...");
        dialogOpened.remove();
      });
      return false;
    }
    var navdrawerOpened = $("#navdrawer").hasClass("show");
    if(navdrawerOpened) {
      $("#navdrawer").navdrawer("hide");
      return false;
    }
    var footerTabbar = $("#footerTabbar")[0];
    var myNavigator = $("#myNavigator")[0];
    if(myNavigator.pages.length>1) {
      if(DEBUG) console.log("Popping page...");
      var options = (isIOS && (isSafari || appType=='ios') && !iosPopPageAnimation) ? {animation: "none"} : {};
      myNavigator.popPage(options);
      iosPopPageAnimation = false;
      return false;
    } else if(footerTabbar.getActiveTabIndex()!==1){ 
      if(DEBUG) console.log("Moving to home tab index...");
      footerTabbar.setActiveTab(1);
    } else {
      if(DEBUG) console.log("Closing app...");
    }
    return true;
  };
}

// Onsen
export function openPage(templateName, options) {
	var page = document.querySelector('#myNavigator').pushPage(templateName, options);
	$("#leftPanel").navdrawer("hide");
	window.history.pushState({page: templateName}, templateName);
	return page;
}
export function replacePage(templateName, options) {
	$("#leftPanel").navdrawer("hide");
    var page = document.querySelector('#myNavigator').replacePage(templateName, options);
	window.history.replaceState({page: templateName}, templateName);
	return page;
}
export function bringPageTop(templateName, options) {
    var page = document.querySelector('#myNavigator').bringPageTop(templateName, options);
	return page;
}
export function resetToPage(templateName, options) {
	var page = document.querySelector('#myNavigator').resetToPage(templateName, options);
	return page;
}
export function popPage() {
	if(DEBUG) console.log("Popping page...");
	iosPopPageAnimation = true;	
	window.history.back();
}
export function openDialog(templateName, options) {	
	var dialog = ons.createDialog(templateName, { append: true }).then(function(dialog) {
		if(typeof options!=='undefined' && typeof options.data!=='undefined')
			for(const [key, value] of Object.entries(options.data))
				$(dialog).attr("data-"+key, value);
		dialog.show(options);
	});	
	window.history.pushState({page: templateName}, templateName);
	return dialog;
}
export function closeDialog() {
	if(DEBUG) console.log("Closing opened dialog...");
	var dialogOpened = $("ons-dialog:visible:last");
	if(dialogOpened.length) {
		var dialog = dialogOpened[0];
		dialog.hide().then(function() {
			if(DEBUG) console.log("Removing opened dialog...");
			dialogOpened.remove();
		});
	}
}
export function getCurrentPageId() {
	return document.querySelector('#myNavigator').topPage.id;
}
// Toast
var toastTimeout = null;
export function showToast(message, noTimeout) {
  if(typeof toast==='undefined' || !toast) {
    if(DEBUG) console.log("Toast undefined");
      return;
  }
  if(!$(toast).is(":visible")) {
    $("#toast").find("#message").html(message);
    toast.show();
  } else {
    var currentMessage = $("#toast").find("#message").html();
    $("#toast").find("#message").html(currentMessage+"<br>"+message);
    clearTimeout(toastTimeout);
  }
  if(!noTimeout) {
    toastTimeout = setTimeout(function () {
      toast.hide();
    }, 4000);
  }
}
export function hideToast() {
  toast.hide();
}
// Pullhook
export function onPullHookChangeState(event) {
  var pullHook = event.target;
  var message = '';
  switch (event.state) {
      case 'initial':
          message = 'Trascina per aggiornare';
          break;
      case 'preaction':
          message = 'Rilascia';
          break;
      case 'action':
          message = '';		
          break;
  }
  pullHook.innerHTML = message;
  return;
}


// Get all parameters in a GET request
export function getParameterByName(url, name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}



// Manage cookies
export function checkCookies() {
  if(!navigator.cookieEnabled) {
      $("#cookieAlertDiv").show();
  }
}
export function setCookie(key, value, expiry) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (expiry * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString() + '; path=/';
}
export function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}
export function clearCookie(key) {
  var keyValue = getCookie(key);
  setCookie(key, keyValue, '-1');
}