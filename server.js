var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var fs = require('fs');
var cookieSession = require('cookie-session');

const SELECT_ALL_TAREAS = "SELECT tarea.id,titulo,descripcion,usr1.nombre as autor,usr2.nombre as ejecutor,fecha,estado FROM tarea,usuario as usr1,usuario as usr2 WHERE autor=usr1.id and ejecutor=usr2.id";
const SELECT_ALL_TAREASID = "SELECT tarea.id,titulo,descripcion,usr1.nombre as autor,usr1.id as autorid,usr2.nombre as ejecutor,usr2.id as ejecutorid,fecha,estado FROM tarea,usuario as usr1,usuario as usr2 WHERE autor=usr1.id and ejecutor=usr2.id";
var app = express();

app.use(cookieSession({
  name: 'session',
  keys: ["SID"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
  // maxAge: 60 * 1000 // 1 min
}))

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(jsonParser);
app.use(urlencodedParser);

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'apptareas'
});

connection.connect(function (error) {
  if (error) {
    throw error;
  } else {
    console.log('Conexion correcta con el servidor.');
  }
});


/** 
 * Puntos de entrada de mi servidor
 */


app.get('/login', function (req, res) {

  fs.readFile("./www/login.html", "utf8", function (err, texto) {
    res.send(texto);
  })

});

app.post('/login', function (req, res) {
  console.log(req.session.user);
  console.log(req.session.idUser);
  var usuario = req.body.usuario;
  var password = req.body.password;
  console.log("Post login");
  connection.query("select * FROM usuario where usuario=? AND password=?", [usuario, password], function (err, result) {
    if (err) {
      throw err
    } else {
      if (result.length > 0) {
        req.session.user = usuario;
        req.session.idUser = result[0].id;
        console.log("login " + req.session.idUser);
        res.redirect('/tarea');
      } else {
        fs.readFile("./www/login.html", "utf8", function (err, texto) {
          texto = texto.replace('class="ocultar">[error]', 'class="mostrar">Usuario o contraseña incorrectas');

          res.send(texto);
        })

      }
    }
  });

})

app.get('/registro', function (req, res) {
  fs.readFile("./www/registro.html", "utf8", function (err, texto) {
    res.send(texto);
  })
});

app.post('/registro', function (req, res) {
  var nombre = req.body.nombre;
  var usuario = req.body.usuario;
  var email = req.body.email;
  var password = req.body.password;

  connection.query("insert into usuario (nombre,usuario,password,email) values (?,?,?,?)", [nombre, usuario, password, email], function (err, result) {
    res.send("Usuario introducido correctamente " + nombre);
  });

})

app.get('/tarea', function (req, res) {
  console.log(req.session.user);
  console.log(req.session.idUser);
  if (req.session.user == undefined || req.session.idUser == false) {
    res.redirect('/login');
  } else {
    fs.readFile("www/tareas.html", "utf8", function (err, texto) {
      texto = texto.replace("[usuario]", req.session.user);
      connection.query("select * from usuario", function (err, result) {
        let options = "";
        if (err) {
          throw err;
        } else {
          for (const usuario of result) {

            options += `<option value='${usuario.id}' >${usuario.nombre}</option>`;



          }
        }
        texto = texto.split("[ejecutores]").join(options);

        res.send(texto);
      })

    })
  }

});

app.get("/peticion", function (req, res) {
  // console.log(req.session.user);
  setInterval(function () {
    res.send("hola mundo");
  }, 5000);

});

app.get("/cerrar", function (req, res) {
  req.session = null;
  res.redirect("/login");
})

app.get("/datosuser", function (req, res) {
  //console.log(req.session.idUser);
  connection.query("select * from usuario where id=?", [req.session.idUser], function (err, result) {
    if (err) {
      throw err;
    } else {
      //console.log(result);
      var datos = {
        id: result[0].id,
        nombre: result[0].nombre,
        usuario: result[0].usuario,
        email: result[0].email
      }

      // setTimeout(function () {
      //   res.send(JSON.stringify(datos));
      // }, 5000);
      res.send(JSON.stringify(datos));
    }
  });
})

app.post("/datosuser", function (req, res) {

  if (req.body.password == "") {
    res.send("noOk");
  } else {
    connection.query("UPDATE usuario SET nombre = ?, email = ?, password=? WHERE id = ?",
      [req.body.nombre, req.body.email, req.body.password, req.session.idUser],
      function (err, result) {
        if (result.affectedRows > 0) {

          res.send("ok");
        } else {
          res.send("noOk");
        }

      });
  }
})

app.post("/nuevatarea", function (req, res) {
  var result;
  // console.log(req.body);
  connection.query("insert into tarea (titulo,descripcion,fecha,autor,ejecutor) values (?,?,?,?,?)",
    [req.body.titulo, req.body.descripcion, req.body.fecha, req.session.idUser, req.body.ejecutor],
    function (err, result) {

      connection.query(SELECT_ALL_TAREASID, function (error, resultado) {
        resultado.forEach(element => {

          if (req.session.idUser == element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 0;
          }
          if (req.session.idUser == element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 1;
          }
          if (req.session.idUser != element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 2;
          }
          if (req.session.idUser != element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 3;
          }

        });

        if (error) {
          throw error;
        } else {
          resultado = formatearFecha(resultado);
          if (err) {
            console.log(err)
            result = {
              estado: 0,
              idtarea: null,
              tareas: resultado
            }
          } else {

            // console.log(result);
            result = {
              estado: 1,
              idtarea: result.insertId,
              tareas: resultado
            }
          }
          res.send(JSON.stringify(result));
        }
      });
    });
})

app.get("/leertareas", function (req, res) {
  // SELECT tarea.id,titulo,descripcion,usr1.nombre as ejecutor, ejecutor, usr2.nombre as autor,autor FROM tarea,usuario as usr1,usuario as usr2 WHERE autor=usr1.id and ejecutor=usr2.id
  connection.query(SELECT_ALL_TAREASID, function (error, resultado) {
    // console.log(resultado)
    console.log(req.session.idUser);
    console.log(req.session.user);
    resultado.forEach(element => {

      if (req.session.idUser == element.autorid && req.session.idUser == element.ejecutorid) {
        element.permiso = 0;
      }
      if (req.session.idUser == element.autorid && req.session.idUser != element.ejecutorid) {
        element.permiso = 1;
      }
      if (req.session.idUser != element.autorid && req.session.idUser == element.ejecutorid) {
        element.permiso = 2;
      }
      if (req.session.idUser != element.autorid && req.session.idUser != element.ejecutorid) {
        element.permiso = 3;
      }

    });
    //console.log(resultado);
    resultado = formatearFecha(resultado);
    res.send(JSON.stringify(resultado));
  });
});

app.get("/eliminartarea/:id?", function (req, res) {
  var respuesta = {};
  console.log("Eliminando tarea " + req.query.id);
  connection.query("DELETE FROM tarea WHERE id = ?", [req.query.id], function (err, result) {
    connection.query(SELECT_ALL_TAREASID, function (error, resultado) {
      resultado.forEach(element => {
        if (req.session.idUser == element.autorid && req.session.idUser == element.ejecutorid) {
          element.permiso = 0;
        }
        if (req.session.idUser == element.autorid && req.session.idUser != element.ejecutorid) {
          element.permiso = 1;
        }
        if (req.session.idUser != element.autorid && req.session.idUser == element.ejecutorid) {
          element.permiso = 2;
        }
        if (req.session.idUser != element.autorid && req.session.idUser != element.ejecutorid) {
          element.permiso = 3;
        }
      });
      resultado = formatearFecha(resultado);
      if (err) {
        throw err;
        respuesta = {
          estado: 0,
          tareas: resultado
        }
      } else {
        respuesta = {
          estado: 1,
          tareas: resultado
        }
      }
      res.send(JSON.stringify(respuesta));

    })


  });

});

app.get("/gettarea/:id?", function (req, res) {
  let datos = {
    usuarios: []
  };
  connection.query("SELECT  tarea.id as idtarea,titulo,descripcion,autor as autorid,ejecutor as ejecutorid,fecha,estado,usuario.id as usuarioid,nombre FROM tarea RIGHT JOIN usuario on tarea.id=? and autor=usuario.id", [req.query.id], function (err, result) {
    for (const iterator of result) {

      if (iterator.idtarea) {
        datos.tarea = {
          id: iterator.idtarea,
          titulo: iterator.titulo,
          descripcion: iterator.descripcion,
          autor: iterator.autorid,
          ejecutor: iterator.ejecutorid,
          fecha: iterator.fecha,
          estado: iterator.estado
        }
      }

      if (iterator.usuarioid) {
        let user = {
          id: iterator.usuarioid,
          nombre: iterator.nombre
        }
        datos.usuarios.push(user);
      }

    }
    res.send(JSON.stringify(datos));
  })


});

app.post("/actualizartarea", function (req, res) {
  var result;
  // console.log(req.body);
  connection.query("UPDATE tarea SET titulo = ?, descripcion = ?, ejecutor = ? WHERE id = ?",
    [req.body.titulo, req.body.descripcion, req.body.ejecutor, req.body.id],
    function (err, result) {

      connection.query(SELECT_ALL_TAREASID, function (error, resultado) {
        resultado.forEach(element => {

          if (req.session.idUser == element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 0;
          }
          if (req.session.idUser == element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 1;
          }
          if (req.session.idUser != element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 2;
          }
          if (req.session.idUser != element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 3;
          }

        });

        if (error) {
          throw error;
        } else {
          resultado = formatearFecha(resultado);
          if (err) {
            console.log(err)
            result = {
              estado: 0,
              idtarea: null,
              tareas: resultado
            }
          } else {

            // console.log(result);
            result = {
              estado: 1,
              idtarea: result.insertId,
              tareas: resultado
            }
          }
          res.send(JSON.stringify(result));
        }
      });
    });
})

app.get("/cambioestado/:id?", function (req, res) {
  connection.query("UPDATE tarea SET estado = 1 WHERE id = ?", [req.query.id], function (err, result) {
    if (err) {
      throw err;
    } else {

      connection.query(SELECT_ALL_TAREASID, function (error, resultado) {
        resultado.forEach(element => {

          if (req.session.idUser == element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 0;
          }
          if (req.session.idUser == element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 1;
          }
          if (req.session.idUser != element.autorid && req.session.idUser == element.ejecutorid) {
            element.permiso = 2;
          }
          if (req.session.idUser != element.autorid && req.session.idUser != element.ejecutorid) {
            element.permiso = 3;
          }

        });

        if (error) {
          throw error;
        } else {
          resultado = formatearFecha(resultado);
          if (err) {
            console.log(err)
            result = {
              estado: 0,
              tareas: resultado
            }
          } else {

            // console.log(result);
            result = {
              estado: 1,
              tareas: resultado
            }
          }
          res.send(JSON.stringify(result));
        }
      });

    }
  });
})


app.use(express.static('www'));

//Inicio el servidor
var server = app.listen(3000, function () {
  console.log('Servidor web iniciado');
});


function formatearFecha(result) {
  for (let i = 0; i < result.length; i++) {
    let d = new Date(String(result[i].fecha));
    let formatFecha = [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/');
    result[i].fecha = formatFecha;
  }
  return result;
}

