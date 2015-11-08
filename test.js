var str = "{\n\
status: 'ok\n'\
}"

var a = new Function('return '+ str)
    console.log(str);
    console.log(a);
    console.log(a());
    console.log(str.split(/\n/));