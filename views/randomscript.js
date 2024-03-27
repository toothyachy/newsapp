<ul>
    <% for (let a of articles) { %>
        <li><a href=<%=a.url%>><%=a.title%></a></li>
        <li><img src=<%=a.urlToImage%> alt=""></li>
        <li><%=a.publishedAt%></li>
        <li><%=a.description%></li>
        <li><%=a.source%></li>
    <% } %>

</ul>