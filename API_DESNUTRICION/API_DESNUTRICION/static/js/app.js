function mostrarModulo(id){


document.querySelectorAll(".modulo")
.forEach(
m=>m.classList.add("oculto")
);



document.getElementById(id)
.classList.remove("oculto");



if(id==="dashboard"){

cargarDashboard();

}


if(id==="metricas"){

cargarMetricas();

}


if(id==="variables"){

cargarVariables();

}



}

// ============================================
// PREDICCION INDIVIDUAL
// ============================================


document
.getElementById("formIndividual")
.addEventListener(
"submit",
async function(e){


e.preventDefault();



let datos = crearDatosModelo();



let respuesta = await fetch(
"/predict",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(datos)

});



let resultado =
await respuesta.json();



document.getElementById(
"resultadoIndividual"
).innerHTML = `


<div class="alert alert-info">

<h4>
Resultado
</h4>


<p>
<b>Diagnóstico:</b>
${resultado.descripcion}
</p>


<p>
<b>Probabilidad:</b>
${resultado.probabilidad}
</p>


<p>
<b>Riesgo:</b>
${resultado.riesgo}
</p>


</div>


`;



});





function crearDatosModelo(){


let datos = {};


// ==================================================
// VALORES POR DEFECTO DE LAS 114 VARIABLES
// ==================================================


const variables = [

"area",
"provincia",
"orden_hijo",
"sexo",
"embarazo_planeado",
"embarazo_deseado_pareja",
"control_prenatal",
"lugar_control_prenatal",
"consumo_micronutrientes_embarazo",
"frecuencia_micronutrientes",
"control_peso_embarazo",
"medicion_altura_uterina",
"examen_vih_embarazo",
"numero_examenes_vih",
"control_presion_embarazo",
"examen_sangre_embarazo",
"examen_orina_embarazo",
"examen_sifilis_embarazo",
"vacuna_tetanos",
"dosis_tetanos",
"consejeria_embarazo",
"consejeria_micronutrientes",
"consejeria_signos_alarma",
"consejeria_higiene_alimentos",
"consejeria_lavado_manos",
"consejeria_anticonceptivos",
"consejeria_apego_lactancia",
"semanas_primer_control",
"numero_controles_prenatales",
"lugar_parto",
"personal_parto",
"tipo_parto",
"prematuro",
"peso_registrado_nacer",
"tamizaje_neonatal",
"bano_antes_24h",
"corte_oportuno_cordon",
"carne_salud_infantil",
"registro_curva_crecimiento",
"registro_talla_nacer",
"talla_nacer_cm",
"registro_perimetro_cefalico",
"perimetro_cefalico_cm",
"registro_peso_nacer",
"peso_nacer_gramos",
"peso_nacer_reportado",
"bajo_peso_nacer",
"tamano_recien_nacido",
"control_posparto",
"tiempo_primer_control_posparto",
"lugar_control_posparto",
"control_medico_nino",
"tiempo_primer_control_nino",
"motivo_control_nino",
"controles_0_1_anio",
"controles_1_2_anios",
"controles_2_5_anios",
"numero_controles_carnet",
"establecimiento_salud",
"consejeria_lactancia",
"consejeria_micronutrientes_nino",
"consejeria_alimentacion_complementaria",
"consejeria_higiene_nino",
"consejeria_lavado_manos_nino",
"consejeria_anticonceptivos_nino",
"consejeria_desarrollo_infantil",
"lactancia_anios",
"lactancia_meses",
"lactancia_dias",
"nino_vive",
"vive_con_madre",
"diarrea_ultimas_2_semanas",
"infeccion_respiratoria_2_semanas",
"desparasitacion_6_meses",
"hierro_polvo_12_meses",
"hierro_otra_presentacion",
"vitamina_a_12_meses",
"vacuna_bcg_carnet",
"vacuna_hepatitis_b_carnet",
"vacuna_rotavirus_1_carnet",
"vacuna_rotavirus_2_carnet",
"vacuna_pentavalente_1_carnet",
"vacuna_pentavalente_2_carnet",
"vacuna_pentavalente_3_carnet",
"vacuna_ipv_1_carnet",
"vacuna_opv_2_carnet",
"vacuna_opv_3_carnet",
"vacuna_neumococo_1_carnet",
"vacuna_neumococo_2_carnet",
"vacuna_neumococo_3_carnet",
"vacuna_srp_1_carnet",
"vacuna_srp_2_carnet",
"lugar_vacuna_bcg",
"lugar_vacuna_hepatitis_b",
"lugar_vacuna_rotavirus_1",
"lugar_vacuna_rotavirus_2",
"lugar_vacuna_pentavalente_1",
"lugar_vacuna_pentavalente_2",
"lugar_vacuna_pentavalente_3",
"lugar_vacuna_ipv_1",
"lugar_vacuna_opv_2",
"lugar_vacuna_opv_3",
"lugar_vacuna_neumococo_1",
"lugar_vacuna_neumococo_2",
"lugar_vacuna_neumococo_3",
"lugar_vacuna_srp_1",
"lugar_vacuna_srp_2",
"region_madre",
"etnia_madre",
"edad_meses",
"grupo_edad_meses",
"nivel_instruccion_madre",
"factor_expansion",
"estrato"

];



// crear todas las variables

variables.forEach(v=>{


    datos[v]=0;


});




// ==================================================
// VALORES FIJOS
// ==================================================


datos.area=1;

datos.provincia=18;

datos.region_madre=1;

datos.etnia_madre=1;

datos.factor_expansion=1;

datos.estrato=1;




// ==================================================
// DATOS INGRESADOS POR USUARIO
// ==================================================


datos.edad_meses =
Number(
document.getElementById(
"edad_meses"
).value
);



datos.grupo_edad_meses =
datos.edad_meses;



datos.sexo =
Number(
document.getElementById(
"sexo"
).value
);



datos.peso_nacer_gramos =
Number(
document.getElementById(
"peso_nacer_gramos"
).value
);



datos.talla_nacer_cm =
Number(
document.getElementById(
"talla_nacer_cm"
).value
);



datos.prematuro =
Number(
document.getElementById(
"prematuro"
).value
);



datos.lactancia_meses =
Number(
document.getElementById(
"lactancia_meses"
).value
);



datos.diarrea_ultimas_2_semanas =
Number(
document.getElementById(
"diarrea_ultimas_2_semanas"
).value
);



datos.infeccion_respiratoria_2_semanas =
Number(
document.getElementById(
"infeccion_respiratoria_2_semanas"
).value
);



return datos;


}

// ===============================
// PREDICCION MASIVA
// ===============================


const formularioArchivo =
document.getElementById("uploadForm");


if(formularioArchivo){


formularioArchivo.addEventListener(
"submit",
async function(e){


e.preventDefault();



const archivo =
document.getElementById("archivo").files[0];



const estado =
document.getElementById("estado");


const resultado =
document.getElementById("resultadoMasivo");



if(!archivo){


estado.innerHTML =
"Seleccione un archivo";


return;


}



estado.innerHTML =
"⏳ Procesando archivo, espere por favor...";



const datos =
new FormData();



datos.append(
"archivo",
archivo
);



try{


const respuesta =
await fetch(
"/predict-file",
{

method:"POST",

body:datos

}

);



if(!respuesta.ok){


throw new Error(
"Error en procesamiento"
);


}



// Detectar tipo respuesta

const tipo =
respuesta.headers.get(
"content-type"
);



if(tipo.includes("application/json")){


const json =
await respuesta.json();



estado.innerHTML =
"✅ Archivo procesado correctamente";



mostrarResumenMasivo(json);



}else{


const blob =
await respuesta.blob();



const url =
window.URL.createObjectURL(blob);



const enlace =
document.createElement("a");



enlace.href=url;



enlace.download=
"resultado_prediccion.xlsx";



document.body.appendChild(enlace);



enlace.click();



enlace.remove();



estado.innerHTML =
"✅ Resultado descargado correctamente";


}



}

catch(error){


console.log(error);


estado.innerHTML =
"❌ Error procesando archivo";


}



});


}


function mostrarResumenMasivo(datos){



const div =
document.getElementById(
"resultadoMasivo"
);



if(!div)
return;



div.innerHTML = `


<div class="card p-3">


<h4>
Resumen del análisis
</h4>


<p>
Registros procesados:
<b>
${datos.total ?? "-"}
</b>
</p>


<p>
Casos con riesgo:
<b>
${datos.casos_desnutricion ?? "-"}
</b>
</p>



<p>
Porcentaje:
<b>
${datos.porcentaje ?? "-"} %
</b>
</p>



</div>


`;



}


// ======================================
// DASHBOARD
// ======================================


async function cargarDashboard(){


try{


const respuesta =
await fetch("/dashboard");


const datos =
await respuesta.json();



document.getElementById("total").innerHTML =
datos.total_registros;



document.getElementById("desnutricion").innerHTML =
datos.casos_desnutricion;



document.getElementById("sinDesnutricion").innerHTML =
datos.casos_sin_desnutricion;



document.getElementById("porcentaje").innerHTML =
datos.porcentaje_desnutricion+"%";





// GRAFICO BARRAS


new Chart(
document.getElementById(
"graficoCasos"
),
{


type:"bar",


data:{


labels:[

"Con desnutrición",

"Sin desnutrición"

],


datasets:[{

label:"Cantidad de niños",


data:[


datos.casos_desnutricion,

datos.casos_sin_desnutricion


]


}]


},


options:{


responsive:true


}


});






// GRAFICO DONA


new Chart(
document.getElementById(
"graficoPorcentaje"
),
{


type:"doughnut",


data:{


labels:[

"Desnutrición",

"Sin desnutrición"

],


datasets:[{


data:[


datos.casos_desnutricion,

datos.casos_sin_desnutricion


]


}]


}


});




}

catch(error){


console.log(
"Error dashboard:",
error
);


}


}


// ======================================
// METRICAS DEL MODELO
// ======================================


async function cargarMetricas(){


try{


const respuesta =
await fetch("/dashboard/metricas");


const datos =
await respuesta.json();



document.getElementById("accuracy").innerHTML =
(datos.accuracy * 100).toFixed(2)+"%";



document.getElementById("precision").innerHTML =
(datos.precision * 100).toFixed(2)+"%";



document.getElementById("recall").innerHTML =
(datos.recall * 100).toFixed(2)+"%";



document.getElementById("f1").innerHTML =
(datos.f1_score * 100).toFixed(2)+"%";



}


catch(error){


console.log(
"Error métricas:",
error
);


}



}

// ======================================
// VARIABLES IMPORTANTES
// ======================================


let graficoVariables;



async function cargarVariables(){


try{


const respuesta =
await fetch("/dashboard/importancia");


const datos =
await respuesta.json();



const variables =
datos.slice(0,10);



const nombres =
variables.map(
v=>formatearNombre(v.variable)
);



const valores =
variables.map(
v=>v.importancia
);



const ctx =
document.getElementById(
"graficoVariables"
);



if(graficoVariables){

graficoVariables.destroy();

}



graficoVariables =
new Chart(ctx,{


type:"bar",


data:{


labels:nombres,


datasets:[{


label:
"Importancia del modelo",


data:valores


}]


},



options:{


indexAxis:"y",


responsive:true,


plugins:{


legend:{


display:false


}



}


}


});



}


catch(error){


console.log(
"Error cargando variables:",
error
);


}



}






function formatearNombre(nombre){


return nombre

.replace("cat__","")

.replaceAll("_"," ")

.replaceAll("-"," ")

.replace(/\b\w/g,
l=>l.toUpperCase()
);


}