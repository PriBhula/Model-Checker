const LexerTokens = require("./lexer-tokens");
module.exports = {
    init:init,
    redraw: redraw,
    added: ()=>added
};
let compiledResult = "",added=[];
const selector = $("#process-modify-selector");
const addButton = $("#add-modify");
const clearBt = $("#clear-modify");
const outputBox = $("#generated-text");
const rendered = $("#generated-processes");
let vars = {};
function init() {
    addButton.click(()=>addProcess(false));
    clearBt.click(clear);
}
function clear() {
    added.splice(0,added.length);
    compile(true);
}
function compile(shouldRender) {
    //Force upper case
    let processName = "OUTPUT";
    processName = processName.substring(0,1).toUpperCase()+processName.substring(1);
    let isExisting = getProcessFromCode(processName)!==null;
    //If the new name already exists in the editor, notify the user by changing the button label
    let editorLabel =  isExisting?`<span class="glyphicon glyphicon-upload"></span> Update Process`:`<span class="glyphicon glyphicon-play"></span> Add to Editor`;
    
    if (isExisting) {
        const type =_.find(app.automata.allValues,{id:processName}.type);
    }
    let hasCompiled = added.length>0;
    //If we have no processes, empty the buffer and return
    if (!hasCompiled) {
        rendered.html("");
        outputBox.text(" ");
        return;
    }
    //Create a string with the process type and the name
    let output = processName + " = ";
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
    const pname = $(`<label>Process: ${process.id}</label><br /><label>Edge prefix</label>`);
    const removeBt = $(`<button class="btn btn-primary navbar-btn pull-right">Remove</button>`);
    const nameTb = $(`<input type="text" class="form-control" style="padding-left: 20px; float:left" placeholder="No prefix" value="${process.name}"/>`);
    nameTb.on("input",()=>{
        process.name = nameTb.val();
        compile(false);
    });
    removeBt.click(()=>{
        added.splice(added.indexOf(process),1);
        compile(true);
    });
    form.append(gp1);
    gp1.append(pname);
    gp1.append(nameTb);
    const table = $(`<table border="1"><tr><th style="padding: 0 10px;">Edge Name</th><th style="padding: 0 10px;">New Name</th><th style="padding: 0 10px;">Hide Edge?</th></tr></table>`);

    for (const a in process.renamed) {
        const alphabet = process.renamed[a];
        const renamed = alphabet.renamed || "";
        const tr = $("<tr></tr>");
        const nametd = $(`<td style="padding: 0 10px;">${alphabet.id}&nbsp;&#8209;></td>`);
        const inputTD = $("<td></td>");
        const input = $(`<input type="text" class="form-control" placeholder="Dont rename" value="${renamed}"/>`);
        input.on("input",()=>{
            alphabet.renamed = input.val();
            compile();
        });
        inputTD.append(input);
        const checkTD = $("<td></td>");
        const check = $(`<input type="checkbox" title="Hide edge" style="margin: 0 10px;"/>`);
        check[0].checked = alphabet.hidden;
        check.change(function(){
            alphabet.hidden = this.checked;
            compile();
        });
        checkTD.append(check);
        tr.append(nametd,inputTD,checkTD);
        table.append(tr);
    }
    form.append(table);
    form.append(removeBt);
    rendered.append(form);
}

function getProcessFromCode(id) {
    const process = find(id);
    if (!process) return null;
    const loc = process.metaData.location;
    return app.editor.getCode().substring(loc.startIndex,loc.endIndex);
}
function addProcess() {
    const id = selector.val();
    const process = find(id);
   
        //loop over all subkeys from the selected process, then map them to an array with some default states
        added.push({
            id: id,
            name: "",
            renamed: generateRenameMap(process)
        });
    

    const variables = process.metaData.variables;
    for (let v in variables) {
        vars[variables[v]] = false;
    }
    const vs = process.metaData.hidden_vars;
    for (const v in vs) {
        const variable = vs[v];
        vars[variable]=true;
    }
    compile(true);
}


function generateRenameMap(process) {
    const map = {};
    const alphaMap = process.metaData.alphabet_before_hiding || process.alphabet;
    alphaMap.forEach(alpha => {
        map[alpha] = {id: alpha, renamed: "", hidden: false};
    });
    return map;
}

function redraw() {}
function removeProcess(id) {
    this.splice("added",this.added.indexOf(id),1);
}
function find(id) {
    return _.find(app.automata.allValues, {id: id});
}
