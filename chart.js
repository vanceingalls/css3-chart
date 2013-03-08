(function (win) {
  "use strict";

  var doc       = win.document,
      head      = doc.getElementsByTagName('head')[0],
      style     = doc.createElement('style'),

      // data modeled as async requests
      Metrics = {
        totalUsers: function (cb) {
          if (cb) {
            win.setTimeout(function () {
              cb({"@startDate":"2010-12-01","@metric":"TotalUsers","@endDate":"2010-12-20","@version":"1.0","@generatedDate":"12/20/10 5:24 PM","day":[{"@value":"53819","@date":"2010-12-01"},{"@value":"57558","@date":"2010-12-02"},{"@value":"61141","@date":"2010-12-03"},{"@value":"64872","@date":"2010-12-04"},{"@value":"68495","@date":"2010-12-05"},{"@value":"71623","@date":"2010-12-06"},{"@value":"75000","@date":"2010-12-07"},{"@value":"78454","@date":"2010-12-08"},{"@value":"81759","@date":"2010-12-09"},{"@value":"85345","@date":"2010-12-10"},{"@value":"89234","@date":"2010-12-11"},{"@value":"93452","@date":"2010-12-12"},{"@value":"96345","@date":"2010-12-13"},{"@value":"100462","@date":"2010-12-14"},{"@value":"103824","@date":"2010-12-15"},{"@value":"106738","@date":"2010-12-16"},{"@value":"110239","@date":"2010-12-17"},{"@value":"114587","@date":"2010-12-18"},{"@value":"119272","@date":"2010-12-19"},{"@value":"124892","@date":"2010-12-20"}]});
            }, 0);
          }
        },
        activeUsers: function (cb) {
          if (cb) {
            win.setTimeout(function () {
              cb({"@startDate":"2010-12-01","@metric":"ActiveUsersByDay","@endDate":"2010-12-20","@version":"1.0","@generatedDate":"12/20/10 5:23 PM","day":[{"@value":"41553","@date":"2010-12-01"},{"@value":"41144","@date":"2010-12-02"},{"@value":"40008","@date":"2010-12-03"},{"@value":"38243","@date":"2010-12-04"},{"@value":"37217","@date":"2010-12-05"},{"@value":"40894","@date":"2010-12-06"},{"@value":"41705","@date":"2010-12-07"},{"@value":"40476","@date":"2010-12-08"},{"@value":"41786","@date":"2010-12-09"},{"@value":"41093","@date":"2010-12-10"},{"@value":"39575","@date":"2010-12-11"},{"@value":"41027","@date":"2010-12-12"},{"@value":"43043","@date":"2010-12-13"},{"@value":"40742","@date":"2010-12-14"},{"@value":"40535","@date":"2010-12-15"},{"@value":"39569","@date":"2010-12-16"},{"@value":"39119","@date":"2010-12-17"},{"@value":"40312","@date":"2010-12-18"},{"@value":"39067","@date":"2010-12-19"},{"@value":"29471","@date":"2010-12-20"}]});
            }, 0);
          }
        }
      },

      // wait for both requests to resolve before drawing chart
      ready = when(Metrics.totalUsers, Metrics.activeUsers);

  function convertDate (date, skipYear) {
    var _date = new Date(date);
    return (_date.getUTCMonth() + 1) + '/' + _date.getUTCDate() + (skipYear ? '' : '/' + _date.getUTCFullYear().toString().substr(2));
  }

  function bindEvent (element, type, handler) {
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else {
      element.attachEvent('on'+type, handler);
    }
  }

  function getOffset (el, stopId) {
    var left = el.offsetLeft,
        top = el.offsetTop,
        _el = el;
    
    while (el = el.offsetParent) {
      if (el.id === stopId) {
        break;
      }
      left += el.offsetLeft;
    }

    el = _el;
    while (el = el.offsetParent) {
      if (el.id === stopId) {
        break;
      }
      top += el.offsetTop;
    }
    return [left, top];
  }

  // wait for all async methods to complete before processing callbacks
  function when () {
    var args    = arguments,
        len     = args.length,
        results = new Array(len),
        cbArr   = [],
        counter = 0,
        state   = 'pending',

        methods = {
          then: function (cb) {
            if (state === 'resolved') {
              cb.apply(null, results);
            } else {
              cbArr.push(cb);  
            }
            
            return methods;
          }
        },
        i;

    for (i = args.length - 1; i >= 0; i--) {
      (function (i) {
        args[i](function(data) {
          results[i] = data;
          if (++counter === len) {
            state = 'resolved';
            for (var r = 0; r < cbArr.length; r++) {
              cbArr[r].apply(null, results);
            };
          }
        });
      })(i);
    };

    return methods;
  }

  function drawGraph (total, active) {
    // chart max is biggest data point + 5% rounded up to nearest thousandth
    var total_max = Math.max.apply(null, total.day.map(function (d) { return d[ '@value' ] })),
        plus20th = total_max + (total_max / 20),
        roundPosition = Math.max(Math.floor(Math.log(plus20th) / Math.log(10)), 2) - 2,
        decimal = Math.pow(10, 0 - roundPosition),
        roundedUp = Math.ceil(plus20th * decimal) / decimal,

        days_total  = total.day,
        days_active = active.day,

        container = doc.createElement('div'),
        graph_dates = doc.createElement('ul'),
        module = doc.getElementById('data-graph'),

        day_total, day_active, val_total, val_active, date, percent_total, ratio, ratio_percent, ratio_inverse, performance, anim_style, 
        wrapper, total_bar, active_bar, tooltip, li, total_offset, last_ratio, i;

    container.id = 'container';
    graph_dates.id = 'graph-dates';
    module.appendChild(container);
    module.appendChild(graph_dates);
    
    container.innerHTML = [
      '<ul id="graph-users">',
        '<li class="noline">', roundedUp ,' <div></div> </li>',
        '<li>', roundedUp * .9 ,' <div></div> </li>',
        '<li>', roundedUp * .8 ,' <div></div> </li>',
        '<li>', roundedUp * .7 ,' <div></div> </li>',
        '<li>', roundedUp * .6 ,' <div></div> </li>',
        '<li>', roundedUp * .5 ,' <div></div> </li>',
        '<li>', roundedUp * .4 ,' <div></div> </li>',
        '<li>', roundedUp * .3 ,' <div></div> </li>',
        '<li>', roundedUp * .2 ,' <div></div> </li>',
        '<li>', roundedUp * .1 ,' <div></div> </li>',
        '<li class="noline">0 <div></div> </li>',
      '</ul>'
    ].join('');

    // loop through days_total
    for (i = 0; i < days_total.length; i++) {
      day_total  = days_total[i];
      day_active = days_active[i];
      val_total  = day_total['@value'];
      val_active = day_active['@value'];
      date       = convertDate(day_total['@date'], 1);

      percent_total = Math.round((val_total / roundedUp) * 100);

      ratio = val_active / val_total;

      ratio_percent = Math.round((val_active / val_total) * 100);

      ratio_inverse = 100 - Math.round(percent_total * ratio);

      performance = !i ? 'neutral' : ratio < last_ratio ? 'negative' : 'positive';

      // add dynamic animation styles
      anim_style = [ 
      '.bar-active' + i + ' {\n',
      '  -webkit-animation-name: slideup' + i + ';',
      '}\n\n',

      '@-webkit-keyframes slideup' + i + ' {\n',
      ' from {\n',
      '    top: 110%;\n',
      '  }\n',
      '  to {\n',
      '    top: ',ratio_inverse,'%;\n',
      '  }\n',
      '}\n' ].join('');

      if (style.styleSheet) {
        style.styleSheet.cssText = anim_style;
      } else {
        style.appendChild(doc.createTextNode(anim_style));
      }

      wrapper = doc.createElement('div');
      total_bar = doc.createElement('div');
      active_bar = doc.createElement('div');
      tooltip = doc.createElement('div');

      tooltip.id = 'tooltip' + i;

      wrapper.className = 'bar-wrapper';
      total_bar.className = 'bar-total';
      active_bar.className = 'bar-active bar-active' + i + ' ' + performance + '-bar';
      tooltip.className = 'tooltip in top';

      total_bar.setAttribute('style', 'height:' + percent_total + '%');
      active_bar.setAttribute('style', 'top:' + ratio_inverse + '%');

      // tooltip
      tooltip.innerHTML = [
      '<div class="tooltip-inner">',
      '  Total: <strong>293847</strong><br>',
      '  Active: <strong>2345</strong><br>',
      '  Ratio: <strong class="'+performance+'">'+ratio_percent+'%</strong>',
      '</div>',
      '<div class="tooltip-arrow"></div>'].join('');

      wrapper.appendChild(total_bar);
      wrapper.appendChild(active_bar);

      // add date row
      li = doc.createElement('li');
      li.innerHTML = date;
      graph_dates.appendChild(li);

      container.appendChild(wrapper);

      total_offset = getOffset(total_bar, 'container');
      tooltip.setAttribute('style', 'left:' + (total_offset[0] - 20) + 'px; top:' + (total_offset[1] - 80) + 'px;');
      container.appendChild(tooltip);

      // bind hover event to handle tooltip display
      (function (tooltip) {
        bindEvent(wrapper, 'mouseover', function (e) {
          if(e.target.className.match(/bar-total|bar-active/)) {
            tooltip.className += ' showMe';
          }
        });

        bindEvent(wrapper, 'mouseout', function (e) {
          tooltip.className = 'tooltip in top';
        });
      })(tooltip);

      last_ratio = ratio;
    }
  }

  function drawTable (total, active) {
    doc.getElementById('data-table').innerHTML = [
      '<table class="table" summary="Daily metrics of active users compared to total users.">',     
        '<thead><tr><td>&nbsp;</td></tr></thead>',
        '<tbody>',
          '<tr><th scope="row">Total Users</th></tr>',
          '<tr><th scope="row">Active Users</th></tr>',
          '<tr><th scope="row">Active/Total</th></tr>',
        '</tbody>',
      '</table>'
    ].join('');

    var container = doc.getElementById('data-table'),
        table     = container.getElementsByTagName('table')[0],

        head      = table.getElementsByTagName('thead')[0].getElementsByTagName('tr')[0],
        bodyRows  = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr'),
        
        totalRow  = bodyRows[0],
        activeRow = bodyRows[1],
        ratioRow  = bodyRows[2],

        days_total  = total.day,
        days_active = active.day,

        date, last_ratio, day_total, day_active, th, td, ratio, i;

    // loop through days_total
    for (i = 0; i < days_total.length; i++) {
      day_total  = days_total[i];
      day_active = days_active[i];
      ratio      = Math.floor((day_active['@value'] / day_total['@value']) * 100);
      date       = convertDate(day_total['@date'], 1);

      // add column headers
      th = doc.createElement('th');
      th.setAttribute('scope', 'col');
      th.innerHTML = date;
      head.appendChild(th);

      // add total users row
      td = doc.createElement('td');
      td.innerHTML = day_total['@value'];
      totalRow.appendChild(td);

      // add total users row
      td = doc.createElement('td');
      td.innerHTML = day_active['@value'];
      activeRow.appendChild(td);

      // add ratio row
      td = doc.createElement('td');
      if(last_ratio) {
        td.setAttribute('class', last_ratio < ratio ? 'positive' : 'negative');
      }
      td.innerHTML = ratio + '%';
      ratioRow.appendChild(td);

      last_ratio = ratio;
    };
  }

  function drawSubtitle (total, active) {
    doc.getElementById('sub-title').innerHTML = 'Daily Users from <strong>' + convertDate(total[ '@startDate' ]) + '</strong> to <strong>' + convertDate(total[ '@endDate' ]) + '</strong>';
  }

  // INITIALIZE

  // add an empty stylesheet for dynamic manipulation
  style.type = 'text/css';
  head.appendChild(style);

  // initialize page with table view
  ready.then(drawSubtitle).then(drawTable);

  // bind view toggle buttons
  bindEvent(doc.getElementById('view-toggle'), 'click', function (e) {
    var buttons = this.getElementsByTagName('button'),
        clicked = e.target;

    if (clicked.className.match('active')) {
      return;
    }

    if (clicked.id === 'table-view') {
      doc.getElementById('graph-view').className = 'btn';
      doc.getElementById('data-graph').innerHTML = '';
      ready.then(drawTable);
    } else {
      doc.getElementById('table-view').className = 'btn';
      doc.getElementById('data-table').innerHTML = '';
      ready.then(drawGraph);
    }
    clicked.className += ' active';
  });

})(window);