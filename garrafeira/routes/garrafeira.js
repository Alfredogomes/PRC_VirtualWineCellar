var express = require('express');
var router = express.Router();

const SparqlClient = require('sparql-client-2')
const SPARQL = SparqlClient.SPARQL
const endpoint = 'http://localhost:7200/repositories/vinhos'
const myupdateEndpoint = 'http://localhost:7200/repositories/vinhos/statements'

var client = new SparqlClient( endpoint, {updateEndpoint: myupdateEndpoint, 
                               defaultParameters: {format: 'json'}})

client.register({rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                 gV: 'http://www.semanticweb.org/pc/ontologies/2018/5/vinhos#'})


/*GET homepage */
router.get('/', function(req, res, next){
    var query = "SELECT distinct ?vinhos WHERE{\n" + 
                "?r a gV:Vinho.\n"+
                "?r gV:tipoVinho ?vinhos.}"

    client.query(query)
            .execute()
            .then(function(qres){
                console.log(JSON.stringify(qres))
                var resList = qres.results.bindings
                var dot = "digraph Vinhos {\n"+
                            'V [shape=box,label="Vinhos"];\n'+
                            'tipos [shape=diamond, label="Tipos de Vinho", color=blue];\n' +
                            'V -> tipos;\n'
                
                for(var i in resList){
                    var tipo = resList[i].vinhos.value
                    var tipoId = tipo.slice(tipo.indexOf('#')+1)
                    var url = "http://localhost:3000/garrafeira/tipoVinho/" + tipoId

                    dot += 'd' + i +'[label="' + tipoId + '",href="'+ url + '"];\n'
                    dot += 'tipos -> d' + i + '[color=blue];\n'
                }

                dot += "}"
                res.render("showGarrafeira", {renderingCode: 'd3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
            })
            .catch((error)=>{
                res.render("error", {error:error})
            })
})

router.get('/tipoVinho/:tipoId', (req, res, next)=>{
    var tipoId = req.params.tipoId
    var query = "SELECT distinct ?vinhosPorTipo WHERE{\n" + 
                "?g gV:tipoVinho \""+ tipoId + "\".\n"+
                "?g gV:nomeVinho ?vinhosPorTipo.}\n"

    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph VinhosPorTipo {\n" +
                    'graph[layout=dot, rankdir=LR];\n' +
                    'C [label="Tipos de Vinho", href="http://localhost:3000/", color=blue];\n' +
                    'ti [shape=diamond, label=\"' + tipoId + '\"];\n' +
                    'C -> ti[color=blue];\n'

            
            
            for(var i in resList){
                var garrafa = resList[i].vinhosPorTipo.value
                var gar = garrafa.slice(garrafa.indexOf('#')+1)
                var url = "http://localhost:3000/garrafeira/" + gar
                
                dot += 'c' + i + '[label="' + gar + '",href="' + url + '"];\n'
                dot += 'ti -> c' + i + '[color=red];\n'
            }

            dot += "}"
            res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
        })
        .catch((error)=>{
            res.render("error", {error:error})
        }) 
})
                 
router.get('/:gar', (req, res, next)=>{
    var gar = req.params.gar
    var query = "SELECT ?nome ?tipo ?teorAlcool ?capacidade ?temperatura ?colheita ?desc ?produtor ?nomeRegiao WHERE{ \n" +
                "?g gV:nomeVinho \"" + gar + "\".\n" +
                "?g gV:nomeVinho ?nome.\n" +
                "?g gV:tipoVinho ?tipo.\n" +
                "OPTIONAL{?g gV:teorAlcoolico ?teorAlcool.} \n" +
                "OPTIONAL{?g gV:capacidade ?capacidade.} \n" +
                "OPTIONAL{?g gV:temperatura ?temperatura.} \n" +
                "OPTIONAL{?g gV:colheita ?colheita.} \n" +
                "OPTIONAL{?g gV:descricaoVinho ?desc.} \n" +
                "?g gV:éProduzidoPor ?p. \n" +
                "?p gV:nomeProdutor ?produtor. \n" +
                "?g gV:provemDe ?r. \n" +
                "?r gV:nomeRegiao ?nomeRegiao.}\n" 
                
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings

            var dot = "digraph propriedadesVinho {\n"+
                        'graph[layout=circo];\n'
            console.log(resList)
            var Vnome = resList[0].nome.value
            var Vtipo = resList[0].tipo.value

            dot += 'nV' + '[label="' + Vnome + '",shape=diamond, color=red];\n'
            dot += 'tV' + '[label="' + Vtipo + '",  href="http://localhost:3000/garrafeira/tipoVinho/' + Vtipo + '"];\n'
            dot += 'nV' + '-> tV [color=blue, label="Tipo"];\n'

            if(resList[0].teorAlcool != undefined) 
            {
                var VteorAlcool = resList[0].teorAlcool.value
                dot += 'tAV' + '[label="' + VteorAlcool + '", href="http://localhost:3000/garrafeira/teorAlcoolico/' + VteorAlcool + '"];\n'
                dot += 'nV' + '-> tAV [label="Alcool"];\n'
            }
            if(resList[0].capacidade != undefined) 
            {
                var Vcapacidade = resList[0].capacidade.value
                dot += 'cV' + '[label="' + Vcapacidade + '", href="http://localhost:3000/garrafeira/capacidade/' + Vcapacidade + '"];\n'
                dot += 'nV' + '-> cV [label="Capacidade"];\n'
            }
            if(resList[0].temperatura != undefined) 
            {
                var Vtemperatura = resList[0].temperatura.value
                dot += 'tempV' + '[label="' + Vtemperatura + '", href="http://localhost:3000/garrafeira/temperatura/' + Vtemperatura + '"];\n'
                dot += 'nV' + '-> tempV [label="Temperatura"];\n'
            }
            if(resList[0].colheita != undefined) 
            {
                var Vcolheita = resList[0].colheita.value
                dot += 'colV' + '[label="' + Vcolheita + '", href="http://localhost:3000/garrafeira/colheita/' + Vcolheita + '"];\n'
                dot += 'nV' + '-> colV [label="Colheita"];\n'
            }
            if(resList[0].produtor != undefined) 
            {
                var Vprodutor = resList[0].produtor.value
                dot += 'pV' + '[label="' + Vprodutor + '",  href="http://localhost:3000/garrafeira/produtor/' + Vprodutor + '"];\n'
                dot += 'nV' + '-> pV [color=purple, label="Produtor"] ;\n'
            }
            if(resList[0].nomeRegiao != undefined) 
            {
                var VnomeRegiao = resList[0].nomeRegiao.value
                dot += 'nRegV' + '[label="' + VnomeRegiao + '",  href="http://localhost:3000/garrafeira/regiao/' + VnomeRegiao + '"];\n'
                dot += 'nV' + '-> nRegV [color=green, label="Região"];\n'
            }
            if(resList[0].desc != undefined) 
            {
                var Vdesc = resList[0].desc.value
                dot += 'dV' + '[label="' + Vdesc + '"];\n'
                dot += 'nV' + '-> dV [label="Descrição"];\n'
            }


            dot += "}"
            res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
           

        })
        .catch((error)=>{
            res.render("error", {error:error})
        }) 
})

router.get('/produtor/:Vprodutor', (req, res, next)=>{
    var pro = req.params.Vprodutor
    var query = "SELECT ?nomeP ?local ?desc (group_concat(distinct ?pro;separator='|') as ?produz) (group_concat(distinct ?reg;separator='|') as ?regiao) WHERE{\n" + 
                "?g a gV:Produtor.\n" +
                "?g gV:nomeProdutor \"" + pro + "\"." +
                "?g gV:nomeProdutor ?nomeP.\n" +
                "OPTIONAL{?g gV:localizacaoProdutor ?local.}\n" +
                "OPTIONAL{?g gV:descricaoProdutor ?desc.}\n" +
                "?g gV:produzVinho ?p.\n" +
                "?p gV:nomeVinho ?pro.\n" +
                "?g gV:produzEmRegiao ?r.\n" +
                "?r gV:nomeRegiao ?reg.\n" +
                "}\n" +
                "group by ?nomeP ?local ?desc"
                
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var Pnome = resList[0].nomeP.value
            var Plocal = resList[0].local.value
            var Pdesc = resList[0].desc.value
            var Pproduz = resList[0].produz.value
            var Pregiao = resList[0].regiao.value

            var dot = "digraph propriedadesProdutor {\n" +
                    'graph[layout=dot, rankdir=LR];\n' +
                    'C [label="Produtores", href="http://localhost:3000/garrafeira/produtor/", color=purple];\n'

            dot += 'nP' + '[label="' + Pnome + '",shape=diamond];\n'
            dot += 'C -> nP [color=purple];\n'
            dot += 'lP' + '[label="Localidade : ' + Plocal + '"];\n'
            dot += 'nP' + '-> lP;\n'

            var vinho = Pproduz.split("|")
            for(var i in vinho){
                dot += 'proP' + i + '[label="Produz: ' + vinho[i] + '", href="http://localhost:3000/garrafeira/' + vinho[i] + '"];\n'
                dot += 'nP' + '-> proP' + i + '[color=red];\n'
            }

            var regiao = Pregiao.split("|")
            for(var i in regiao){
                dot += 'regP' + i + '[label="Produz na região: ' + regiao[i] + '", href="http://localhost:3000/garrafeira/regiao/' + regiao[i] + '"];\n'
                dot += 'nP' + '-> regP' + i + '[color=green];\n'
            }


            dot += 'dP' + '[label="Descrição: ' + Pdesc + '"];\n'
            dot += 'nP' + '-> dP;\n'

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})


router.get('/regiao/:regiao', (req, res, next)=>{
    var reg = req.params.regiao
    var query = "SELECT ?nome ?desc (group_concat(distinct ?p;separator='|') as ?produtor) (group_concat(distinct ?v;separator='|') as ?vinho) WHERE{\n" + 
                "?g a gV:Regiao.\n" +
                "?g gV:nomeRegiao \"" + reg +  "\".\n" +
                "?g gV:nomeRegiao ?nome.\n" +
                "?g gV:descricaoRegiao ?desc.\n" +
                "?g gV:temProdutor ?pro.\n" +
                "?pro gV:nomeProdutor ?p.\n" +
                "?g gV:temVinho ?vi.\n" +
                "?vi gV:nomeVinho ?v.\n" +
                "}\n" +
                "group by ?nome ?desc" 
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var Rnome = resList[0].nome.value
            var Rdesc = resList[0].desc.value
            var Rprod = resList[0].produtor.value
            var Rvin = resList[0].vinho.value

            var dot = "digraph propriedadesRegiao {\n"+
                        'graph[layout=dot, rankdir=LR];\n' +
                    'C [label="Regiões", href="http://localhost:3000/garrafeira/regiao/", color=green];\n'

            dot += 'nR' + '[label="' + Rnome + '", shape=diamond];\n'
            dot += 'C -> nR [color=green];\n'

            var prod = Rprod.split("|")
            dot += 'P[label="Tem Produtores",shape=diamond,color=purple];\n'
            dot += 'nR -> P;\n'
            for(var i in prod){
                dot += 'pR' + i + '[label="Produtor: ' + prod[i] + '", href="http://localhost:3000/garrafeira/produtor/' + prod[i] + '"];\n'
                dot += 'P' + '-> pR' + i + '[color=purple];\n'
            }

            var vin = Rvin.split("|")
            dot += 'V[label="Tem Vinhos", shape=diamond, color=red];\n'
            dot += 'nR -> V;\n'
            for(var i in vin){
                dot += 'vR' + i + '[label="Vinho: ' + vin[i] + '", href="http://localhost:3000/garrafeira/' + vin[i] + '"];\n'
                dot += 'V' + '-> vR' + i + '[color=red];\n'
            }

            dot += 'dR' + '[label="Descrição: ' + Rdesc + '"];\n'
            dot += 'nR' + '-> dR;\n'


        dot += "}"
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})


router.get('/garrafeira/regiao', (req, res, next)=>{
    var query = "SELECT ?regiao WHERE{\n" + 
                "?g gV:nomeRegiao ?regiao.}"  
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph regioes {\n"
            dot += 'R[shape=box , label="Regiões"];\n'

            for(var i in resList){
                var Rnome = resList[i].regiao.value
                dot += 'nR' + i + '[label="' + Rnome + '", href="http://localhost:3000/garrafeira/regiao/' + Rnome + '"];\n'
                dot += 'R -> nR' + i + '[color=green];\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})


router.get('/garrafeira/produtor', (req, res, next)=>{
    var query = "SELECT ?produtor WHERE{\n" + 
                "?g gV:nomeProdutor ?produtor.}"  
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph produtores {\n"
            dot += 'P[shape=box , label="Produtores"];\n' +
                    'graph[layout=dot, rankdir=LR];\n' 

            for(var i in resList){
                var Pnome = resList[i].produtor.value
                dot += 'nP' + i + '[label="' + Pnome + '", href="http://localhost:3000/garrafeira/produtor/' + Pnome + '"];\n'
                dot += 'P -> nP' + i + '[color=purple];\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

router.get('/garrafeira/teorAlcoolico/:teor', (req, res, next)=>{
    var teor = req.params.teor
    var query = "SELECT ?vinho ?teor WHERE{\n" +
                "?g gV:nomeVinho ?vinho.\n" +
                "?g gV:teorAlcoolico \"" + teor + "\".\n" +
                "?g gV:teorAlcoolico ?teor.\n}" 
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph teor {\n" + 
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'Todos[shape=box, label="Outros", href="http://localhost:3000/garrafeira/teorAlcoolico/"];\n'
            dot += 'T[shape=box , label=\"' + teor + '\"];\n'

            for(var i in resList){
                var Tnome = resList[i].vinho.value
                dot += 'nT' + i + '[label="' + Tnome + '", href="http://localhost:3000/garrafeira/' + Tnome + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }


        dot += "}"
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

router.get('/garrafeira/teorAlcoolico', (req, res, next)=>{
    var query = "SELECT distinct ?teor WHERE{\n" + 
                "?g gV:teorAlcoolico ?teor.\n}"   
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph teores {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'T[shape=box , label="Teor Alcoolico"];\n'

            for(var i in resList){
                var Tnum = resList[i].teor.value
                dot += 'nT' + i + '[label="' + Tnum + '", href="http://localhost:3000/garrafeira/teorAlcoolico/' + Tnum + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

//temperatura
router.get('/garrafeira/temperatura/:temp', (req, res, next)=>{
    var temp = req.params.temp
    var query = "SELECT ?nome WHERE{\n" + 
                "?g gV:nomeVinho ?nome.\n" +
                "?g gV:temperatura \"" + temp + "\".\n"+
                "?g gV:temperatura ?temperatura.\n}"  
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph temperatura {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'Tem[shape=box, label="Temperaturas", href="http://localhost:3000/garrafeira/temperatura/"];\n'
            dot += 'Temp[shape=box , label=\"' + temp + '\"];\n'

            for(var i in resList){
                var Temp = resList[i].nome.value
                dot += 'nT' + i + '[label="' + Temp + '", href="http://localhost:3000/garrafeira/' + Temp + '"];\n'
                dot += 'Temp -> nT' + i + ';\n'
            }


        dot += "}"
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

router.get('/garrafeira/temperatura', (req, res, next)=>{
    var query = "SELECT distinct ?temperatura WHERE{\n" + 
                "?g gV:temperatura ?temperatura.\n}"  
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph temperaturas {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'T[shape=box , label="Temperatura"];\n'

            for(var i in resList){
                var Temp = resList[i].temperatura.value
                dot += 'nT' + i + '[label="' + Temp + '", href="http://localhost:3000/garrafeira/temperatura/' + Temp + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

//colheita
router.get('/garrafeira/colheita/:col', (req, res, next)=>{
    var col = req.params.col
    var query = "SELECT ?nome WHERE{\n" +
                "?g gV:nomeVinho ?nome.\n" +
                "?g gV:colheita \"" + col + "\"^^xsd:integer.\n}" 
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph colheita {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'C[shape=box, label="Colheitas", href="http://localhost:3000/garrafeira/colheita/"];\n'
            dot += 'T[shape=box , label=\"' + col + '\"];\n'

            for(var i in resList){
                var Tnome = resList[i].nome.value
                dot += 'nT' + i + '[label="' + Tnome + '", href="http://localhost:3000/garrafeira/' + Tnome + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }


        dot += "}"
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

router.get('/garrafeira/colheita', (req, res, next)=>{
    var query = "SELECT distinct ?colheita WHERE{\n" +
                "?g gV:colheita ?colheita.\n}"    
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph colheitas {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'C[shape=box , label="Colheitas"];\n'

            for(var i in resList){
                var Col = resList[i].colheita.value
                dot += 'nT' + i + '[label="' + Col + '", href="http://localhost:3000/garrafeira/colheita/' + Col + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

//capacidade
router.get('/garrafeira/capacidade/:cap', (req, res, next)=>{
    var cap = req.params.cap
    var query = "SELECT ?nome WHERE{\n" +
                "?g gV:nomeVinho ?nome.\n" +
                "?g gV:capacidade \""+ cap + "\".\n}"  
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings
            var dot = "digraph capacidade {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'Todos[shape=box, label="Outras", href="http://localhost:3000/garrafeira/capacidade/"];\n'
            dot += 'T[shape=box , label=\"' + cap + '\"];\n'

            for(var i in resList){
                var Tnome = resList[i].nome.value
                dot += 'nT' + i + '[label="' + Tnome + '", href="http://localhost:3000/garrafeira/' + Tnome + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }


        dot += "}"
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

router.get('/garrafeira/capacidade', (req, res, next)=>{
    var query = "SELECT distinct ?cap WHERE{\n" +
                "?g gV:capacidade ?cap\n}"   
 
    client.query(query)
        .execute()
        .then(function(qres){
            console.log(JSON.stringify(qres))
            var resList = qres.results.bindings 
            var dot = "digraph capacidades {\n" +
            'graph[layout=dot, rankdir=LR];\n'
            dot += 'T[shape=box , label="Capacidades"];\n'

            for(var i in resList){
                var Cap = resList[i].cap.value
                dot += 'nT' + i + '[label="' + Cap + '", href="http://localhost:3000/garrafeira/capacidade/' + Cap + '"];\n'
                dot += 'T -> nT' + i + ';\n'
            }

        dot += "}"
        console.log(dot)
        res.render("showGarrafeira" , {renderingCode:'d3.select("#graph").graphviz().renderDot(\`' + dot + '\`)'})
    
        })
    .catch((error)=>{
        res.render("error", {error:error})
    }) 
})

module.exports = router;