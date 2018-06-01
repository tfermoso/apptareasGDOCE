window.onload=function(){
    console.log("página lista");

    // document.getElementById("repassword").onblur=function(ev){
    //     alert("repassword pierde foco")
    // }

    document.getElementById("repassword").addEventListener("blur", function(){

      if(document.getElementById("password").value!=document.getElementById("repassword").value){
      
        document.getElementById("mensajes").setAttribute("style","display:block");
        document.getElementById("mensajes").innerHTML="Las contraseñas deben ser iguales";
      }else{
          console.log("iguales");
        document.getElementById("btnGuardar").disabled=false;
      }
    })

    document.getElementById("repassword").addEventListener("focus", function(){
    
        document.getElementById("mensajes").setAttribute("style","display:none");
    })

   


   
}