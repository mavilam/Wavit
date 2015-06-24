# Wavit


Wavit es una aplicación web que permite eliminar barreras de comunicación, incluyendo las culturales, comunicación
entre personas que hablen distintos idiomas, y las originadas por discapacidades de tipo
auditivo.

La aplicación permite realizar una video llamada capturando la imagen de las personas
que intervienen en esta comunicación, a través de la cámara del dispositivo que usen y
mostrando el video capturado, además del reconocimiento del habla a través del
micrófono.

El emisor manda un mensaje de voz, que es transcrito a texto y enviado al receptor. Este
tiene la opción de escucharlo con una voz sintética o leer el mensaje mediante los
subtítulos. Estas dos opciones pueden ser activadas o desactivadas, en cualquier
momento, por el receptor.

Además tiene la capacidad de traducir los mensajes al idioma elegido por el receptor,
ignorando totalmente el idioma del emisor. Esto se traduce en que los dos lados de la
comunicación pueden hablar en su idioma nativo.
Para la comunicación se ha usado tecnología WebRTC, que se basa en comunicación de
navegador a navegador, sin pasar por servidores, y está desarrollada en JavaScript,
HTML y CSS.

Además de personas con discapacidad auditiva, la aplicación está diseñada para facilitar
su uso de parte de personas con alguna discapacidad visual, siguiendo las pautas
dispuestas por el W3C, para el desarrollo de páginas web accesibles.

##Instrucciones para el uso

Para ejecutar la aplicación en local se debe tener instalado [Node.js]( https://nodejs.org/ )

Hacen falta varios módulos de Node. La instalación de los modulos necesarios:

  *  npm install mstranslator
  *  npm install socket.io
  *  npm install node-static

Una vez que estén instalados en el directorio donde está el código del servidor y del cliente:

  * node multiserver.js

En *localhost:5000* se podrá encontrar un cliente.
