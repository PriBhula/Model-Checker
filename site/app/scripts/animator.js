const LexerTokens = require("./lexer-tokens");
const _ = require("lodash");
module.exports = {
    init:init,
    redraw: redraw,
    added: ()=>added
};
let compiledResult = "",added=[];
const selector = $("#process-modify-selector");
const typeSelector = $("#process-type-selector");
const addButton = $("#add-modify");
const animateButton = $("#animate");
const nameBox = $("#modify-name");
const generateBt = $("#generate-modify");
const clearBt = $("#clear-modify");
const outputBox = $("#generated-text");
const rendered = $("#generated-processes");
let vars = {};
let selected = [];
function init() {
    typeSelector.change(compile);
    nameBox.on("input",compile);
    addButton.click(()=>addProcess(false));
    animateButton.click(()=>animate(true));
    clearBt.click(clear);
    generateBt.click(addToEditor);
}
function clear() {
    added.splice(0,added.length);
    compile(true);
}
function compile(shouldRender) {
    //Force upper case
    let processName = nameBox.val() || "OUTPUT";
    processName = processName.substring(0,1).toUpperCase()+processName.substring(1);
    let isExisting = getProcessFromCode(processName)!==null;
    //If the new name already exists in the editor, notify the user by changing the button label
    let editorLabel =  isExisting?`<span class="glyphicon glyphicon-upload"></span> Update Process`:`<span class="glyphicon glyphicon-play"></span> Add to Editor`;
    generateBt.val(editorLabel);
    if (isExisting) {
        const type =_.find(app.automata.allValues,{id:processName}.type);
        typeSelector.val(type.type.substring(0,1).toUpperCase()+type.type.substring(1));
    }
    let hasCompiled = added.length>0;
    generateBt.prop("disabled",!hasCompiled);
    //If we have no processes, empty the buffer and return
    if (!hasCompiled) {
        rendered.html("");
        outputBox.text(" ");
        return;
    }
    //Create a string with the process type and the name
    let output = typeSelector.val().toLowerCase() + " " + processName + " = ";
    let processes = [];
    let hidden = new Set();
    if (shouldRender)
        rendered.html("");
    //Loop over all processes
    _.each(added,function(process) {
        if (shouldRender)
            render(process);
        //The stringified version of the current process
        let current = "";
        //If the process has a new name
        if (process.name) {
            //Add the new name and a :
            current+=process.name+":";
        }
        //Add the old name
        current+=process.id;
        let rename = [];
        //If we have some renamed values
        if (Object.keys(process.renamed).length > 0) {
            //Loop over the renaed values
            _.each(process.renamed,function(alphabet) {
                let id = alphabet.id;
                //If the process is renamed, we need to prepend the process name to the id
                if (process.name) {
                    id = process.name+"."+id;
                }
                //If hte action is renamed, push it to the rename map
                if (alphabet.renamed)
                    rename.push(alphabet.renamed + "/" + id);
                //If it is hidden, push it to the hidden map
                if (alphabet.hidden)
                    hidden.add(alphabet.renamed || id);
            });
        }
        //If we ended up with some hidden values, collect them and add to the current process
        if (rename.length > 0)
            current += "/{"+rename.join()+"}";
        //Push the current process to the process list
        processes.push(current);
    });
    let varStr = "";
    if (Object.keys(vars).length > 0) {
        const varsC = [];
        for (const id in vars) {
            if (vars[id]) varsC.push(id);
        }
        if (varsC.length > 0)
            varStr=`\${${varsC.join()}}`;
    }
    let hiddenStr = "";
    //If we ended up with some renamed values, collect them and add to the current process
    if (hidden.size > 0)
        hiddenStr = "\\{"+Array.from(hidden).join()+"}";
    compiledResult = output+"simp(abs(("+processes.join(" || ")+")"+hiddenStr+"))"+varStr+".";
    //Set compiled results to the process name + all the added processes collected + hidden+.
    outputBox.text(compiledResult);
    if (shouldRender && Object.keys(vars).length > 0) {
        renderVars();
    }
}
function renderVars() {
    const form = $(`<form role="form" class="gen-form" style="padding-bottom: 20px"></form>`);
    const gp1 = $(`<div class="form-group"></div>`);
    const pname = $(`<label>Variables to hide</label>`);
    form.append(gp1);
    gp1.append(pname);
    const table = $(`<table border="1"></table>`);
    for (const id in vars) {
        const hidden = vars[id];
        const tr = $("<tr></tr>");
        const nametd = $(`<td style="padding: 0 10px;">${id}</td>`);
        const checkTD = $("<td></td>");
        const check = $(`<input type="checkbox" title="Hide variable symbolically" style="margin: 0 10px;"/>`);
        check[0].checked = hidden;
        check.change(function(){
            vars[id] = this.checked;
            compile(false);
        });
        checkTD.append(check);
        tr.append(nametd,checkTD);
        table.append(tr);
    }
    form.append(table);
    rendered.append(form);
}
function render(process) {
    const form = $(`<form role="form" class="gen-form" style="padding-bottom: 20px"></form>`);
    const gp1 = $(`<div class="form-group"></div>`);
    const removeBt = $(`<button class="btn btn-primary navbar-btn pull-right">Remove</button>`);
    
    
    removeBt.click(()=>{
        added.splice(added.indexOf(process),1);
        compile(true);
    });
    form.append(gp1);
    const table = $(`<table border="1"><tr><th style="padding: 0 10px;">State</th><th style="padding: 0 10px;"></th></tr></table>`);

    for (const a in process.renamed) {
        const alphabet = process.renamed[a];
        const renamed = alphabet.renamed || "";
        const tr = $("<tr></tr>");
        const nametd = $(`<td style="padding: 0 10px;">${alphabet.id}</td>`);
        const inputTD = $("<td></td>");
            
        const checkTD = $("<td></td>");
        const check = $(`<input type="checkbox" title="Hide edge" style="margin: 0 10px;"/>`);
        check[0].checked = alphabet.hidden;
        check.change(function(){
            alphabet.hidden = this.checked;
            selected.push(this.checked);
            addProcess(true);
            compile();
        });
        checkTD.append(check);
        tr.append(nametd,inputTD,checkTD);
        table.append(tr);
    }
    form.append(table);
    form.append(removeBt);
    const stateLabel = $(`<label$<alphabet.id></label>`);
    form.append(stateLabel);
    rendered.append(form);




    
}
function addToEditor() {
    //Dont add anything if there is nothing to add
    if (!compiledResult) return;
    const code = app.editor.getCode();
    let processName = nameBox.val() || "OUTPUT";
    processName = processName.substring(0,1).toUpperCase()+processName.substring(1);
    //A regex that will match an entire process including sub processes.
    //By adding the process we are loking for before, we can look up entire processes.
    const process = getProcessFromCode(processName);
    //If the process already exists
    if (process !== null) {
        //Replace the old version of the process with the new one
        //Note, we need to get rid of the type as its now set by the original process.
        app.editor.setCode(code.replace(process+".", compiledResult.replace(typeSelector.val().toLowerCase() + " ", "")).replace(processName,""));
        return;
    }
    //It doesnt, append the new process
    app.editor.setCode(code+"\n"+compiledResult);
}
function getProcessFromCode(id) {
    const process = find(id);
    if (!process) return null;
    const loc = process.metaData.location;
    return app.editor.getCode().substring(loc.startIndex,loc.endIndex);
}
function addProcess(isImport) {
    $.getScript('models.js', function(){
        for (var i=1;i<selected.length;i++){
            selected
            init(); 
        }
    })
}


function generateRenameMap(process) {
    const map = {};
    const alphaMap = process.metaData.alphabet_before_hiding || process.alphabet;
    alphaMap.forEach(alpha => {
        map[alpha] = {id: alpha, renamed: "", hidden: false};
    });
    return map;
}
function animate(parse) {
    $.getScript('scripts/models.js',function(){
      for (var i=1;i<selected.length;i++){
            $("#check").click(function(){
                $("selected[i]").show();
            });
            init(); 
        }
    }); 
}
function redraw() {
}
function removeProcess(id) {
    this.splice("added",this.added.indexOf(id),1);
}
function find(id) {
    return _.find(app.automata.allValues, {id: id});
}

function getModel(){
    $.getScript('scripts/models.js',function(){
        init();
    }); 
}