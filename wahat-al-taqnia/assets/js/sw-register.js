/* تسجيل العمل دون اتصال — لا شبكة خارجية، لا تتبّع. */
(function(){"use strict";
  if(!("serviceWorker" in navigator))return;
  if(location.protocol!=="http:"&&location.protocol!=="https:")return;
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("sw.js",{scope:"./"}).catch(function(){});
  });
})();
