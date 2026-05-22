window.renderTable = function(cols, rows, actions=[]){
  if (!rows || !rows.length)
    return '<div class="empty-state"><div class="empty-icon">📋</div><h3>No records found</h3><p>Nothing here yet.</p></div>';

  const thead = '<thead><tr>' +
    cols.map(c=>'<th>'+c.label+'</th>').join('') +
    (actions.length ? '<th></th>' : '') +
    '</tr></thead>';

  const tbody = '<tbody>' + rows.map(row => {
    const cells = cols.map(c =>
      '<td>'+(c.render ? c.render(row[c.key], row) : (row[c.key] != null ? row[c.key] : '<span class="text-muted">—</span>'))+'</td>'
    ).join('');
    const acts = actions.length ?
      '<td><div class="action-cell">' +
        actions.map(a =>
          '<button class="btn btn-sm '+(a.cls||'btn-secondary')+'" data-id="'+row._id+'" data-action="'+a.key+'">'+a.label+'</button>'
        ).join('') +
      '</div></td>' : '';
    return '<tr>'+cells+acts+'</tr>';
  }).join('') + '</tbody>';

  return '<div class="table-card"><div class="table-wrap"><table>'+thead+tbody+'</table></div>';
};
