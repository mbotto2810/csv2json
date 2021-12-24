// Coding challenge: csv2json in nodejs
// Maruan Bakri Ottoni
//
// TODO:


// Libraries used
const fs = require('fs');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

// Read CSV file as input and convert to array
var data = fs.readFileSync("input1.csv", "UTF8");
data = data.split(/\n/);

for (let i=0; i<data.length; i++) {
    data[i] = data[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Regex to split commas not inside quotes
}

// Check if last entry is NULL
if(data[data.length-1][0]==='') {
    data.splice(data.length-1, 1);
}

// Prepare data for parsing
merge_groups(data);
remove_quotes(data);

// Create variable to save to file with JSON extension
var json_arr = [];

// Go through everyone on our database
for (let k=1; k < data.length; k++) {
    // Auxiliar variables
    // Makes sure that parsing through certain data only occurs in the first run
    var on = true;
    // Buffer para armazenar dados intermediarios
    var person = {};
    var address = [];
    // Prepare for keys in JSON file
    if (isnotOnJson(json_arr,data[k][1])) {
        for (let i=0; i < data[0].length; i++) {
            // Data
            switch(data[0][i]) {
                case 'fullname':
                    person[data[0][i]] = data[k][i];
                    break
                case 'eid':
                    person[data[0][i]] = data[k][i];
                    break
                case 'group':
                    if(on) {
                        prepare_groups_string(data,k,i)
                        on = false;
                    }
                    break
                case 'see_all':
                    string_bool(data,k,i);
                    break
                case 'invisible':
                    string_bool(data,k,i);
                    break
                default:
                    // Addreses
                    let raw = data[0][i].split(' ');
                    if(raw[0] === 'email' && isValideEmail(data[k][i])) {
                        address.push(address_tags(data,raw,k,i));
                    }
                    else if(raw[0]==='phone' && isValidePhone(data[k][i])) {
                        address.push(address_tags(data,raw,k,i));
                    }
            }
        }
        person['addresses'] = address;
        // Save info to an element in the array
        json_arr.push(person);
    }
}


// Save JSON file
const myConsole = new console.Console(fs.createWriteStream('./output.json'));
myConsole.log(JSON.stringify(json_arr,null,2));










/********************/
/* Helper Functions */
/********************/

// Check if person is alredy on json file
function isnotOnJson(json,eid) {
    let isTrue = true;
    for(let i=0;i<json.length;i++) {
        if(json[i].eid === eid){
            isTrue = false;
        }
    }
    return isTrue
}

// Function to parse address to a correct format
// Prepare the type, tag, and addres keys
function address_tags(data,raw,k,i) {
        //type tag address
        let aux={};
        aux['type'] = raw[0];
        aux['tag'] = raw[1];
        if(raw[0] === 'phone') {
            data[k][i] = phoneUtil.parse(data[k][i], 'BR');
            aux['address'] = phoneUtil.format(data[k][i], PNF.E164);
        }
        else {
            aux['address'] = data[k][i];
        }
        return aux
}


// Concatenate multiple "Sala" entries to a single one
function prepare_groups_string(data,k,i) {
    let str = "";
    for (let j=0; j < data[k][i].length; j++){
        str = str.concat(data[k][i][j].replace(/[^\d+]/g,''));
        str = str.concat(data[k][i][j].replace(/^(?!(?:Noturno|Diurno)$).+$/g,''));
    }
    str = str.replace(/([A-Za-z]+|\d)/g,"$1,");
    str = str.slice(0,-1);
    str = 'Sala '.concat(str);
    person[data[0][i]] = str;
}


// Transform possible ways to express boolean variables to only one
function string_bool(data,k,i){
    if (data[k][i] === '1' || data[k][i]==='True' || data[k][i] === 'true' || data[k][i] === 'yes' ||
        data[k][i] === 'Yes')
    {
            person[data[0][i]] = 'true';
    }
    // Assume that if this field was left incomplete we have a false value
    else {
        person[data[0][i]] = 'false';
    }
}

// Get all the index of groups
function find_groups(data) {
    var index = [];
    for (let i=0; i < data[0].length; i++) {
        if (data[0][i] === 'group')
            index.push(i);
    }
    return index;
}

// Concatenate all groups that the person participates
function merge_groups(data) {
    var index = find_groups(data)
    for (let i=1; i < data.length-1; i++) {
        var aux = [];
        for (let j in index) {
            aux.push(data[i][index[j]]);
        }
        // Merge all groups
        data[i][index[0]] = aux;
        for (let j in index) {
            if ( j > 0 ) {
                data[i].splice(index[j],1);
            }
        }
    }
    // Remove multiple groups from labels
    for (let j in index) {
        if ( j > 0 ) {
            data[0].splice(index[j],1);
        }
    }
}

// Remove quotes from keys
function remove_quotes(data) {
    for (let i=0; i<data[0].length; i++) {
        data[0][i] = data[0][i].replace(/"/g,'');
    }
}

// REGEX to find if email given is a possible email
function isValideEmail(email) {
  const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return res.test(String(email).toLowerCase());
}

// REGEX to find if phone number given is a possible phone
function isValidePhone(phone) {
    if(/(\(?\d{2}\)?\s)?(\d{4,5}[\-\ ]\d{4})/.test(phone))
    {
        return true;
    }
    else {
        return false;
    }
}
