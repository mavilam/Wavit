// Feature testing.
// Redirects to an information page if the browser doesn't support the required APIs
if (!('webkitSpeechRecognition' in window) || !('RTCPeerConnection' in window)){
    window.location = '/errorNoFeatures.html';
}
var goButton = document.getElementById('goButton');
var roomname = document.getElementById('room');
var username = document.getElementById('user');
var langOptions = document.getElementById('langOptions');
var htmlElement = document.querySelector('html');
var langTitle = document.getElementById('langTitle');
var header = document.getElementById('header');
var optGroup = document.getElementById('optGroup');
var info = document.getElementById('info');

goButton.disable = false;
goButton.onclick = vchat;

langOptions.onchange= changeTexts;

function changeTexts(){

  var lang = langOptions.options[langOptions.selectedIndex].value;

  if(lang == "es"){
    htmlElement.setAttribute("lang","es");
    goButton.innerHTML="Entra a la sala";
    roomname.setAttribute("placeholder","Sala");
    roomname.setAttribute("alt","Nombre de la sala de chat");
    roomname.setAttribute("title","Nombre de la sala de chat a la que se desea entrar");
    username.setAttribute("placeholder","Usuario");
    username.setAttribute("title","Nombre de usuario con el que se desea entrar a la sala");
    username.setAttribute("atl","Nombre de usuario");
    header.innerHTML= "Bienvenido a Wavit"
    langTitle.innerHTML = "Tu idioma es: ";
    langTitle.setAttribute("alt","Idioma que vas a hablar");
    optGroup.setAttribute("label","Lenguaje hablado");
    info.setAttribute("title","Información adicional de la aplicación");
    langOptions.setAttribute("title","Selecciona un idioma");
  }else{
    htmlElement.setAttribute("lang","en");
    goButton.innerHTML="Go to the room";
    roomname.setAttribute("placeholder","Room");
    roomname.setAttribute("alt","Chat room name");
    roomname.setAttribute("title","Name of the chat room that you want to go inside");
    username.setAttribute("placeholder","User");
    username.setAttribute("title","Name of the user that you want to use in the room");
    username.setAttribute("atl","Username");
    header.innerHTML= "Welcome to Wavit"
    langTitle.innerHTML = "Your language is: ";
    langTitle.setAttribute("alt","Language that you want to speak");
    optGroup.setAttribute("label","Spoken language");
    info.setAttribute("title","Extra info about the application");
    langOptions.setAttribute("title","Selecct a language");
  }
}

function vchat(room)
{
    room = roomname.value;
    user = username.value;
    var langIndex = langOptions.selectedIndex; // Obtener el índice de la opción que se ha seleccionado
  	var langSelection = langOptions.options[langIndex]; // Con el índice y el array "options", obtener la opción seleccionada
  	var langSelected = langSelection.value; // Obtener el valor de la opción seleccionada

    var roomURL = '/room=' + room + '&user=' + user + '&lang=' + langSelected;

    window.location = roomURL;

}
