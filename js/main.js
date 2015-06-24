'use strict';

var isChannelReady;
var isInitiator = false;
var isStarted = false;
var isRecognitionStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
var out = false;
var preUtt="";

var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

var PC_CONFIG = {
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
};
var langOptions = document.getElementById('langOptions');

var room = location.pathname.split('&user=')[0].split('room=')[1];

var username = location.pathname.split('&user=')[1].split('&lang=')[0];

var langSelected = location.pathname.split('&lang=')[1];

langOptions.value=langSelected;

var localtag = document.getElementById("localtag");
localtag.innerHTML=username;

if (room === '') {

  room = 'Por defecto';
}

var socket = io.connect();

if (room !== '') {
  console.log('Intentando entrar', room);
  socket.emit('sign in',username, room);

}

////////////////////////////////////MSGS FROM THE PEER////////////////////////

var msgInfo = document.getElementById("msg");
var remoteUsername;

socket.on('created', function (room){
  console.log('Room creada ' + room);
  isInitiator = true;
});

socket.on('full', function (room){
  console.log(room + ' esta llena');
});

socket.on('join', function (room){
  console.log('Alguien intenta entrar en ' + room);
  isChannelReady = true;
});

socket.on('joined', function (room){
  console.log('Alguien ha entrado ' + room);

  isChannelReady = true;
});

socket.on('username used', function(room){
  console.log('Ya hay alguien con este nombre');
  if(langSelected == "es"){
    alert("Ya hay alguien con " + username + " como nombre de usuario en esta sala");
  }else{
    alert("Username " + username + " already use in this room");
  }

});

socket.on('full room', function(room){
  console.log('Sala llena');
  if(langSelected == "es"){
    alert('Esta sala ya está llena');
  }else{
    alert('This room is full');
  }

});

socket.on('end',function(message){
  console.log("me voy");

  if(!out){
    sendMessage({
              type: 'end'}
            );
  }

  if(langSelected == "es"){
      msgInfo.innerHTML=remoteUsername + " se ha ido de la sala";
  }else{
      msgInfo.innerHTML=remoteUsername + " has left of the room";
  }
  out = true;
  hangup();
});


socket.on('translation', function (message){
  console.log("trans " + message.text);
  if(isSubtitlesEnabled){
    subtitles.innerText = "";
    subtitles.innerText = message.text;
  }

  if(isUtteranceEnabled){

    var utterance = new SpeechSynthesisUtterance();
    utterance.text = message.text;
    utterance.lang = langSelected;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
});

socket.on('message', function (message){

  if (message.text === 'got user media' ) {
    maybeStart();
    sendMessage({
          type: 'username',
          username: username}
        );
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
      sendMessage({
          type: 'username',
          username: username}
        );
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));

  } else if (message.type === 'candidate' && isStarted) {

    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);

  } else if (message === 'bye' && isStarted) {

    handleRemoteHangup();

  }else if(message.type === 'speech'){

    if(!isUtteranceEnabled && !isSubtitlesEnabled ){
      if(langSelected == "es"){
        msgInfo.innerHTML=remoteUsername + " te está hablando, activa los subtítulos o el audio";
      }else{
        msgInfo.innerHTML=remoteUsername + " is talking to you, enable voice or subtitles";
      }
    }

    handleSpeech(message);
  }else if(message.type === 'username'){
    var remotetag = document.getElementById("remotetag");
    remotetag.innerHTML=message.username;
    remoteUsername=message.username;
  }
});

///////////////////////////////  INFO  ////////////////////////////

var info =  document.getElementById("info");
var init =  document.getElementById("init");

////////////////// JQUERY BOOTSTRAP/////////////////

$('#speech').tooltip();
$('#utterance').tooltip();
$('#translate').tooltip();
$('#subtitle').tooltip();



///////////////////////////////FUNCTION FOR SENDMESSAGE//////////////////////

function sendMessage(message){
  if(message.type === 'offer'){

    var msg = {
      type: 'offer',
      msg: message,
      room: room,
      user: username
    }

    socket.emit('message', msg);
  }else if(message.type === 'answer'){

    var msg = {
      type: 'answer',
      msg: message,
      room: room,
      user: username
    }

    socket.emit('message', msg);

  }else{
    message.room = room;
    message.user = username;

    socket.emit('message', message);
  }

}

/////////////////////GET USER MEDIA FUNCTIONS///////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

function handleUserMedia(stream) {
  console.log('Añadiendo stream local');
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  sendMessage({
              text: 'got user media'});
  maybeStart();
}

function handleUserMediaError(error){
  console.log('getUserMedia error: ', error);
}

var constraints = {video: true,};
getUserMedia(constraints, handleUserMedia, handleUserMediaError);

//////////////////RTCPEERCONNECTION FUNCTIONS//////////////////////7


function maybeStart() {
  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;

    console.log('isInitiator', isInitiator);

    if (isInitiator) {
      doCall();

    }
  }
}

window.onbeforeunload = function(e){
  sendMessage('bye');
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
  } catch (e) {
    console.log('Error RTCPeerConnnection ' + e.message);
      return;
  }
}

function handleIceCandidate(event) {
  console.log('handleIceCandidate : ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Insertado stream remoto');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

function handleCreateOfferError(event){
  console.log('createOffer() error: ', e);
}

function doCall() {
  console.log('Mandando oferta');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Mandando respuesta');
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage envia' , sessionDescription);
  sendMessage(sessionDescription);

}

function handleRemoteStreamAdded(event) {
  console.log('Stream remoto añadido');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
  changeTexts(langSelected);
	talk.addEventListener("click", speechRequest, false);
  subEvent.addEventListener("click", subtitlesRequest, false);
  uttEvent.addEventListener("click", utteranceRequest, false);
}

function handleRemoteStreamRemoved(event) {
  console.log('stream remoto eliminado: ', event);
}

function hangup() {
  console.log('Colgando');
  stop();
}

function handleRemoteHangup() {
  console.log('El usuario remoto ha colgado');
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}



///////////////////////SPEECH RECOGNITION FUNCTIONS//////////////////////


var talk = document.getElementById("clickTalk");
var talk = document.getElementById("talk");

var isSpeechEnabled = false;

langOptions.onchange = changelang;

if (('webkitSpeechRecognition' in window)) {

  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = function() {
    console.log('arranca speech');
  };

  recognition.onresult = function(event) {

        var transcription = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {

            transcription += event.results[i][0].transcript ;

        }


        console.log("from " + langSelected);
        console.log("is final " + event.results[event.results.length - 1].isFinal);
        console.log('Se envia: ',transcription);
        sendMessage({
          type: 'speech',
          from: langSelected,
          text: transcription,
          isFinal: event.results[event.results.length - 1].isFinal}
        );


  };
  recognition.onend = function(event) {
    isSpeechEnabled = false;
    recognition.stop();
    talk.setAttribute("class","btn btn-lg btn-danger btn-block");
    changeTextSpeech(langSelected);
  };

  recognition.onerror = function(error) {
        console.log('Speech recognition error:', error);

  };
}else{
  console.log('Error webkitSpeechRecognition no compatible');
}


function speechRequest(){

  if(isSpeechEnabled){
    isSpeechEnabled = false;
    recognition.stop();
    talk.setAttribute("class","btn btn-lg btn-danger btn-block");
  }else{
    isSpeechEnabled = true;
    recognition.start();
    talk.setAttribute("class","btn btn-lg btn-warning btn-block");
  }

  changeTextSpeech(langSelected);
}


function handleSpeech(message){
  console.log(" @@@ message is final " + message.isFinal );

  if(message.isFinal){
    console.log(message.from + " " + langSelected);

    if(message.from != langSelected){

      sendMessage({
          type: 'translate',
          from: message.from,
          to: langSelected,
          text: message.text}
        );
    }else{
      if(isUtteranceEnabled){

        handleUtteranceMsg(message);

      }
      if(isSubtitlesEnabled ){

          handleSubtitles(message);

      }
      console.log('Recibido mensaje: ' ,message.text);
    }


  }

}

/////////////////////////// Procedimientos del habla


var uttEvent = document.getElementById("utterance");
var uttLi = document.getElementById("utteranceli");
//uttEvent.addEventListener("click", utteranceRequest, false);
var isUtteranceEnabled = false;

function handleUtteranceMsg(message){

    if(message.isFinal){

      var utterance = new SpeechSynthesisUtterance();
      utterance.text = message.text;
      utterance.lang = langSelected;
      utterance.rate = 1;
      if(message.text != preUtt){
        window.speechSynthesis.speak(utterance);
      }
      preUtt = message.text;
    }

}

function utteranceRequest(){

  if(isUtteranceEnabled){
    isUtteranceEnabled = false;
    uttEvent.setAttribute("class","btn btn-lg btn-default btn-block");

  }else{
    isUtteranceEnabled = true;
    uttEvent.setAttribute("class","btn btn-lg btn-primary btn-block");
    msgInfo.innerHTML = "";
  }
  changeTextUtterance(langSelected);
}

function changelang (){

  var langIndex = langOptions.selectedIndex; // Obtener el índice de la opción que se ha seleccionado
  var langSelection = langOptions.options[langIndex]; // Con el índice y el array "options", obtener la opción seleccionada
  langSelected = langSelection.value; // Obtener el valor de la opción seleccionada
  recognition.lang = langSelected;
  isSpeechEnabled = false;
  recognition.stop();
  talk.setAttribute("class","btn btn-lg btn-danger btn-block");
  changeTexts(langSelected);
}

////////////////////SUBTITLES//////////////


var subtitles = document.querySelector('#subtitles');
subtitles.style.visibility = 'hidden';
var isSubtitlesEnabled = false;
var subEvent = document.getElementById("subtitle");
//subEvent.addEventListener("click", subtitlesRequest, false);
var langTitle = document.querySelector('#langTitle');

function handleSubtitles(message){
  subtitles.innerText = "";
  subtitles.innerText = message.text;
}

function subtitlesRequest(){
  if(isSubtitlesEnabled){
    subtitles.style.visibility='hidden';
    subtitles.style.display='none';
    isSubtitlesEnabled = false;
    subEvent.setAttribute("class","btn btn-lg btn-default btn-block");
    subtitles.innerText = ""
  }else{
    msgInfo.innerHTML = "";
    subtitles.style.visibility='visible';
    subtitles.style.display='inline';
    isSubtitlesEnabled = true;
    subEvent.setAttribute("class","btn btn-lg btn-primary btn-block");
  }
  changeTextSubtitles(langSelected);
}

///////////////////////////////////////////////GO OUT FROM THE ROOM

var close = document.getElementById("endComunication");

close.addEventListener("click",returnToIndex,false);

window.addEventListener("beforeunload",goOutFromRoom, false);

function returnToIndex(){
  goOutFromRoom();

  window.location.href = "/index.html";
}

function goOutFromRoom(){
  if(!out){
    sendMessage({
              type: 'end'}
            );
  }

  if(typeof pc != 'undefined' && pc != null){
      hangup();
  }
  out = true;
}


////////////////////////CHANGE THE TEXTS /////////////////

function changeTexts(lang){
  var htmlElement = document.querySelector("html");
	changeTextSpeech(lang);
	changeTextSubtitles(lang);
	changeTextUtterance(lang);
  if(lang == "es"){
    htmlElement.setAttribute("lang","es");
    langTitle.innerHTML = "Cambia el idioma";
    close.innerHTML = "Abandonar la sala";
    close.setAttribute("title","Abandonar la comunicación y salir de esta sala");
    info.setAttribute("title","Información adicional de la aplicación");
    langOptions.setAttribute("title","Selecciona un idioma");
  }else{
    htmlElement.setAttribute("lang","en");
    langTitle.innerHTML = "Change the language";
    info.setAttribute("title","Extra info about the application");
    close.innerHTML = "Go out from the room";
    close.setAttribute("title","End the comunication and go out from the room");
    langOptions.setAttribute("title","Select a language");
  }
}


function changeTextSpeech(lang){
	if(lang == "es"){

		if(isStarted){
			if(!isSpeechEnabled){
				talk.innerHTML = "¡Pincha y habla!";
        talk.setAttribute("alt", "Pincha en el botón para poder hablar");
			}else{
				talk.innerHTML = "¡Para el reconocimiento!";
        talk.setAttribute("alt", "Pincha en el botón para parar el reconocimiento");
			}
		}else{
			talk.innerHTML = "Espera a tu compañero";
      talk.setAttribute("alt", "Espera a que este listo el otro usuario");
		}

	}else{

		if(isStarted){
			if(!isSpeechEnabled){
				talk.innerHTML = "¡Press and talk!";
        talk.setAttribute("alt", "Click in the button to talk ");
			}else{
				talk.innerHTML = "Stop recognition!";
        talk.setAttribute("alt", "Speak now for send a message");
			}
		}else{
			talk.innerHTML = "Wait for your partner";
      talk.setAttribute("alt", "Wait your partner is not ready");
		}

	}
}

function changeTextSubtitles(lang){

	if(lang == "es"){
		if(!isSubtitlesEnabled){
      if(isStarted){
        subEvent.innerHTML = "Pulsa para subtitular";
      }else{
        subEvent.innerHTML = "Espera a tu compañero";
      }

			subEvent.setAttribute("data-original-title","Subtitulos desactivados");
		}else{
			subEvent.innerHTML = "Desactivar los subtitulos"
			subEvent.setAttribute("data-original-title","Subtitulos activados");
		}
	}else{
		if(!isSubtitlesEnabled){
      if(isStarted){
        subEvent.innerHTML = "Enable subtitles";
      }else{
        subEvent.innerHTML = "Wait for your partner";
      }

			subEvent.setAttribute("data-original-title","Subtitles off");
		}else{
			subEvent.innerHTML = "Disable subtitles";
			subEvent.setAttribute("data-original-title","Subtitles off");
		}
	}
}

function changeTextUtterance(lang){

	if(lang == "es"){
		if(!isUtteranceEnabled){
      if(isStarted){
        uttEvent.innerHTML = "Activa traducción de voz";
      }else{
        uttEvent.innerHTML = "Espera a tu compañero";
      }

			uttEvent.setAttribute("data-original-title","Reproductor de habla desactivado");
		}else{
			uttEvent.innerHTML = "Desactiva traducción de voz"
			uttEvent.setAttribute("data-original-title","Reproductor de habla activado");
		}
	}else{
		if(!isUtteranceEnabled){
      if(isStarted){
        uttEvent.innerHTML = "Enable audio translation";
      }else{
        uttEvent.innerHTML = "Wait for your partner";
      }

			uttEvent.setAttribute("data-original-title","Voice player off");
		}else{
			uttEvent.innerHTML = "Disable audio translation";
			uttEvent.setAttribute("data-original-title","Voice player on");
		}
	}
}

changeTexts(langSelected);

sendMessage({
          type: 'username',
          username: username}
        );
