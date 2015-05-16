<%if(data.desc){%>
# <%=data.desc%> #
<%}%>
## URL ##
[<%=data.url%>](<%=data.url%>)

## 返回值格式 ##
<%=data.dataType%>

## HTTP请求方式 ##
<%=data.method%>

## 请求参数 ##

<%if(data.param_name && data.param_name.length){%>
    
参数名 | 必选 | 类型及范围 | 说明
--- | --- | --- | --- <%data.param_name.forEach(function(val,index){%>
<%=data.param_name[index]%> | <%if(data.param_required[index]){%>true<%}else{%>false<%}%> | <%=data.param_type[index]%> | <%=data.param_desc[index]||'无'%><%});%>
<% }else{ %>
无
<% }%>

<%if(data.res){%>
## 返回值 ##
```
<%==data.res%>
```
<%}%>