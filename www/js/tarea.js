window.onload = function () {

    actualizarTabla();

    this.document.getElementById("user").onclick = function () {
        if (document.getElementById("userOptions").getAttribute("class") == "dropdown") {
            document.getElementById("userOptions").setAttribute("class", "dropdownver");
        } else {
            document.getElementById("userOptions").setAttribute("class", "dropdown");
        }

    }

    this.document.getElementById("datosUser").onclick = function (event) {
        event.preventDefault();

        if (document.getElementById("datosUsuario").getAttribute("class") != "mostrar") {
            document.getElementById("loader").setAttribute("class", "loader mostrar");
            document.getElementById("listarTareas").setAttribute("class", "ocultar");
            document.getElementById("crearTarea").setAttribute("class", "ocultar");
            var req = new XMLHttpRequest();
            req.open("GET", "/datosuser", true);
            req.addEventListener("load", function () {
                console.log("petición completada")
                if (req.status >= 200 && req.status < 400) {
                    // Llamada ala función callback pasándole la respuesta
                    var datosUser = JSON.parse(req.response);
                    console.log(datosUser);
                    document.getElementById("nombre").value = datosUser.nombre;
                    document.getElementById("usuario").value = datosUser.usuario;
                    document.getElementById("email").value = datosUser.email;
                    document.getElementById("listarTareas").setAttribute("class", "ocultar");
                    document.getElementById("datosUsuario").setAttribute("class", "mostrar");
                    document.getElementById("loader").setAttribute("class", "loader ocultar");
                } else {
                    console.error(req.status + " " + req.statusText);
                }
            });
            req.addEventListener("error", function () {
                console.error("Error de red");
            });
            req.send(null);

        } else {
            document.getElementById("listarTareas").setAttribute("class", "mostrar");
            document.getElementById("datosUsuario").setAttribute("class", "ocultar");
        }

    }

    this.document.getElementById("btnGuardar").onclick = function (event) {
        event.preventDefault();
        console.log("Enviando datos por post");
        var req = new XMLHttpRequest();
        req.open("POST", "/datosuser", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.addEventListener("load", function () {
            var datos=JSON.parse(req.response);
            document.getElementById("imgavatar").src=datos.avatar;
            // if (req.response == "ok") {
            //     alert("datos actualizados correctamente");
            // } else {
            //     alert("error al actualizar los datos");
            // }

        });
        req.addEventListener("error", function () {
            console.log(req.response);
        });

        var datos = {
            nombre: document.getElementById("nombre").value,
            usuario: document.getElementById("usuario").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            avatar: document.getElementById("avatar").src
        }
        console.log(datos);
        req.send(JSON.stringify(datos));
    }

    this.document.getElementById("btnTarea").onclick = function (ev) {
        ev.preventDefault();
        var req = new XMLHttpRequest();
        req.open("POST", "/nuevatarea", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.addEventListener("load", function () {
            console.log(JSON.parse(req.response));
            var respuesta = JSON.parse(req.response);
            if (respuesta.estado == 1) {
                alert("Tarea creada corectamente idtarea: " + respuesta.idtarea);
                document.getElementById("formTarea").reset();
            } else {
                alert("Error al crear la tarea");
            }
            document.getElementById("crearTarea").setAttribute("class", "ocultar");
            llenarTablaTareas(respuesta.tareas);
        });
        req.addEventListener("error", function () {
            console.log(req.response);
        });

        var datos = {
            titulo: document.getElementById("titulo").value,
            descripcion: document.getElementById("descripcion").value,
            ejecutor: document.getElementById("ejecutor").value,
            fecha: document.getElementById("fecha").value
        }
        console.log(datos);
        req.send(JSON.stringify(datos));
    }

    this.document.getElementById("addTarea").onclick = function () {
        document.getElementById("datosUsuario").setAttribute("class", "ocultar");
        document.getElementById("listarTareas").setAttribute("class", "mostrar");
        document.getElementById("crearTarea").setAttribute("class", "mostrar");
        document.getElementById("titulo").focus();
    }

    this.document.getElementById("btnActTarea").onclick = function (ev) {
        ev.preventDefault();
        var req = new XMLHttpRequest();
        req.open("POST", "/actualizartarea", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.addEventListener("load", function () {
            console.log(JSON.parse(req.response));
            var respuesta = JSON.parse(req.response);
            if (respuesta.estado == 1) {
                alert("Tarea actualizada corectamente idtarea: " + respuesta.idtarea);
                document.getElementById("formActualizarTarea").reset();
            } else {
                alert("Error al actulaizar la tarea");
            }
            document.getElementById("actualizarTarea").setAttribute("class", "ocultar");
            llenarTablaTareas(respuesta.tareas);
        });
        req.addEventListener("error", function () {
            console.log(req.response);
        });

        var datos = {
            id: document.getElementById("idtarea").value,
            titulo: document.getElementById("act_titulo").value,
            descripcion: document.getElementById("act_descripcion").value,
            ejecutor: document.getElementById("act_ejecutor").value,
            fecha: document.getElementById("act_fecha").value
        }
        //console.log(datos);
        req.send(JSON.stringify(datos));
    }

    document.getElementById('foto').addEventListener('change', archivo, false);
}


function llenarTablaTareas(listaTareas) {
    let contenidoTabla = "";
    for (const tarea of listaTareas) {
        let thOptions = "";
        switch (tarea.permiso) {
            case 0:
                thOptions = `<i class="fas fa-pencil-alt" onclick="peticionEditar(${tarea.id})"></i> <i class="fas fa-trash-alt" onclick="peticionEliminar(${tarea.id})"></i> <i class="fas fa-clipboard-list" onclick="cambioEstado(${tarea.id})"></i>`;
                break;
            case 1:
                thOptions = `<i class="fas fa-pencil-alt" onclick="peticionEditar(${tarea.id})"></i> <i class="fas fa-trash-alt" onclick="peticionEliminar(${tarea.id})"></i>`;
                break;
            case 2:
                thOptions = `<i class="fas fa-clipboard-list" onclick="cambioEstado(${tarea.id})"></i>`;
                break;
            case 3:
                thOptions = "";
                break;
        }

        let fila = `<tr>
        <th>${tarea.titulo}</th>
        <th>${tarea.descripcion}</th>
        <th>${tarea.autor}</th>
        <th>${tarea.ejecutor}</th>
        <th>${tarea.fecha}</th>
        <th>${tarea.estado}</th>
        
        <th>${thOptions}</th>
    </tr>`;
        contenidoTabla += fila;
    }
    document.getElementById("tblTareas").innerHTML = contenidoTabla;
}

function peticionEditar(id) {
    var req = new XMLHttpRequest();
    var url = "/gettarea?id=" + id;
    req.open("GET", url, true);
    req.addEventListener("load", function () {
        var datos = JSON.parse(req.response);
        document.getElementById("idtarea").value = datos.tarea.id;
        document.getElementById("act_titulo").value = datos.tarea.titulo;
        document.getElementById("act_descripcion").value = datos.tarea.descripcion;
        document.getElementById("act_fecha").value = String(datos.tarea.fecha).substr(0, 10);
        document.getElementById("actualizarTarea").setAttribute("class", "mostrar");
        document.getElementById("act_ejecutor").value = datos.tarea.ejecutor;
    });
    req.addEventListener("error", function () {

    });
    req.send(null);
}

function peticionEliminar(id) {
    let req = new XMLHttpRequest();
    let url = "/eliminartarea?id=" + id;
    req.open("GET", url, true);

    req.addEventListener("load", function () {
        var resultado = JSON.parse(req.response);
        if (resultado.estado == 1) {
            alert("Tarea elimnada");
        }
        llenarTablaTareas(resultado.tareas);

    })
    req.send(null);
}

function actualizarTabla() {
    var req = new XMLHttpRequest();
    req.open("GET", "/leertareas", true);

    req.addEventListener("load", function () {
        console.log(req.response);

        llenarTablaTareas(JSON.parse(req.response));
    });
    req.addEventListener("error", function (err) {

    });
    req.send(null);
}

function cambioEstado(id) {
    var req = new XMLHttpRequest();
    var url = "/cambioestado?id=" + id;
    req.open("GET", url, true);
    req.addEventListener("load", function () {
        console.log(req.response);
        var datos = JSON.parse(req.response);
        llenarTablaTareas(datos.tareas);
    });
    req.addEventListener("error", function () {

    });
    req.send(null);
}


function archivo(evt) {
    var files = evt.target.files; // FileList object
    var file=files[0];
    var reader= new FileReader();
    reader.addEventListener("load",function(){
        console.log("fichero leido");
        console.log(reader.result);
        document.getElementById("avatar").src=reader.result;
        // document.getElementById("list").innerHTML = ['<img class="thumb" src="', reader.result,'" title="', escape(file.name), '"/>'].join('');
    })
    reader.readAsDataURL(file);

    // Obtenemos la imagen del campo "file".
    // for (var i = 0, f; f = files[i]; i++) {
    //     //Solo admitimos imágenes.
    //     if (!f.type.match('image.*')) {
    //         continue;
    //     }
    //     var reader = new FileReader();

    //     reader.readAsDataURL(files[0]);

    //     //   reader.onload=(function(theFile) {
    //     //           return function(e) {
    //     //               console.log(e.target.result)

    //     //             // Insertamos la imagen
    //     //            document.getElementById("list").innerHTML = ['<img class="thumb" src="', e.target.result,'" title="', escape(theFile.name), '"/>'].join('');
    //     //           };
    //     //       })(files[0])
    //     reader.addEventListener("load", function () {
            
    //         return function (e) {
    //             console.log(e.target.result)

    //             // Insertamos la imagen
    //             document.getElementById("list").innerHTML = ['<img class="thumb" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');
    //         };
    //     });
    //     //   var reader = new FileReader();
    //     //   reader.onload = (function(theFile) {
    //     //       return function(e) {
    //     //           console.log(e.target.result)

    //     //         // Insertamos la imagen
    //     //        document.getElementById("list").innerHTML = ['<img class="thumb" src="', e.target.result,'" title="', escape(theFile.name), '"/>'].join('');
    //     //       };
    //     //   })(f);

    //     //   reader.readAsDataURL(f);
    // }
}


