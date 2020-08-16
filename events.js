var serverSide = (typeof global != 'undefined');

var courseName = 'CS221';
var submissionsPath = '/afs/ir.stanford.edu/class/cs221/submissions/';

function eventsOnLoad() {
  // Note: represent all dates as integers.
  function parseDate(date) {
    if (typeof(date) == 'number') return date;  // Already converted
    return Date.parse(date);  // Need to convert
  }

  var firstDateOfClass = parseDate("Sep 23 2019");  // UPDATE
  var todayDate = Date.now();

  function advanceDate(date, numDays) {
    var newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate.getTime();
  }

  var monthNames = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  var dayNames = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');
  function formatDate(date) {
    date = new Date(date);
    return dayNames[date.getDay()] + ' ' + monthNames[date.getMonth()] + ' ' + date.getDate();
  }

  var currentDate = firstDateOfClass;  // Beginning of the term
  var currentWeek = 0;
  var beginWeek = null;
  function nextClass(n) {
    currentDate = advanceDate(currentDate, n);
    beginWeek = new Date(currentDate).getDay() == 1;  // Monday
    if (beginWeek) currentWeek++;
  }

  // For the schedule
  var schedule = [];
  schedule.push(['', 'Day'.bold(), 'Topic'.bold(), 'Slides'.bold(), 'Events'.bold(), 'Deadlines'.bold()]);

  var horizontalLine = '<td colspan="5"><hr/></td>';
  function section(title, subtitle) {
    schedule.push(['', horizontalLine]);
    schedule.push(['', '', '<div class="scheduledTopic">[' + title + ']</div><br/>' + subtitle.italics(), '', '']);
  }

  var lastDate = null;
  var passedToday = false;
  function disableItem(title, name, extraLinks, pdfOnly) {
    _item(title, name, extraLinks, pdfOnly, false);
  }
  function enableItem(title, name, extraLinks, pdfOnly) {
    _item(title, name, extraLinks, pdfOnly, true);
  }
  function _item(title, name, extraLinks, pdfOnly, enableLinks) {
    var dateStr;
    if (lastDate == currentDate) {  // Still on the same date, don't do anything new
      date = '';
      dateStr = '';
    } else {
      date = currentDate;
      dateStr = formatDate(currentDate);
      lastDate = currentDate;
    }

    var extraDir = '/autumn2019-extra';  // UPDATE
    var jsUrl = 'lectures/index.html#include=' + name + '.js';
    var pdfUrl = extraDir + '/lectures/' + name + '.pdf';
    var smallPdfUrl = extraDir + '/lectures/' + name + '-6pp.pdf';
    var oneUrl = 'lectures/index.html#include=' + name + '.js&mode=print1pp';
    var outlineUrl = 'lectures/index.html#include=' + name + '.js&mode=outline';
    var dayColor = 'green';

    var todayStr = formatDate(todayDate);
    var formattedDateStr = dateStr;
    if (!passedToday) {
      if (todayStr == dateStr) {
        formattedDateStr = (dateStr + ' (today)').fontcolor(dayColor).bold();
        passedToday = true;
      } else if (currentDate > todayDate) {
        schedule.push(['', (todayStr + ' (today)').fontcolor(dayColor).bold()]);
        passedToday = true;
      }
    }

    if (beginWeek && dateStr != '')
      formattedDateStr += '<br/>' + ('(week ' + currentWeek + ')').fontcolor(dayColor);

    var titleStr = (enableLinks ? '<a href="'+jsUrl+'" target="_blank">'+title+'</a>' : title);

    if (pdfOnly) titleStr = title;

    var linksStr = '';
    if (enableLinks) {
      var links = [];
      if (name) {
        if (!pdfOnly) links.push('<a class="pdfLink" href="'+oneUrl+'" target="_blank">[one page]</a>');
        if (!pdfOnly) links.push('<a class="pdfLink" href="'+outlineUrl+'" target="_blank">[text outline]</a>');
        links.push('<span class="pdfLink">[pdf:<a href="'+pdfUrl+'" target="_blank">1pp</a>,<a href="'+smallPdfUrl+'" target="_blank">6pp</a>]</span>');
      }
      if (extraLinks) extraLinks.forEach(function(l) { links.push(l); });
      linksStr = links.join('<br/>');
    }

    if (formattedDateStr != '') {
      schedule.push([date, formattedDateStr, titleStr, linksStr, '']);
    } else {
      // Just piggyback off of the last row
      var row = schedule[schedule.length-1];
      row[2] += '<br/>' + titleStr;
      row[3] += '<br/>' + linksStr;
    }
  }

  function demoLink(name) {
    return '<a href="lectures/index.html#include='+name+'.js" class="pdfLink" target="_blank">[demo]</a>';
  }

  function liveProgrammingLink(name) {
    return '<a href="live/'+name+'" class="pdfLink" target="_blank">[code]</a>';
  }

  function suppmaterialLink(name) {
    return '<a href="lectures/'+name+'" class="pdfLink" target="_blank">[supplementary]</a>';
  }

  var events = {};  // date => list of events
  var deadlines = {};  // deate => list of deadlines
  function addEvent(date, title) {
    date = parseDate(date);
    var list = events[date];
    if (!list) events[date] = list = [];
    list.push(title);
  }
  function addDeadline(date, title) {
    date = parseDate(date);
    var list = deadlines[date];
    if (!list) deadlines[date] = list = [];
    list.push(title);
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var homeworks = [];
  var projects = [];
  var assignments = [];  // For generating submit.conf

  function disableHomework(name, title, numDaysTillDueDate) {
    _homework(name, title, numDaysTillDueDate, false, false);
  }
  function openHomework(name, title, numDaysTillDueDate) {
    _homework(name, title, numDaysTillDueDate, true, false);
  }
  function closedHomework(name, title, numDaysTillDueDate) {
    _homework(name, title, numDaysTillDueDate, true, true);
  }

  function _homework(name, title, numDaysTillDueDate, enableLinks, enableSoln) {
    if (!numDaysTillDueDate) numDaysTillDueDate = 8;
    var outDate = currentDate;
    if (name == 'logic') {
      numDaysTillDueDate += 9
    }
    var dueDate = advanceDate(currentDate, numDaysTillDueDate);

    var renderedName;
    if (enableLinks) {
      renderedName = '<a href="assignments/' + name + '/index.html">'+name+'</a> (<a href="assignments/' + name + '.zip">zip</a>)';
    } else {
      renderedName = name;
    }
    renderedName = '[' + renderedName + ']';
    addEvent(outDate, renderedName + ' ' + 'out'.fontcolor('green').bold());
    addDeadline(dueDate, renderedName + ' ' + 'due'.fontcolor('red').bold());

    if (enableLinks) {
      renderedName = '<a href="assignments/' + name + '/index.html">' + title + ' [' + name + ']</a> (<a href="assignments/' + name + '.zip">zip</a>)';
      if (enableSoln)
        renderedName += ' (<a href="assignments/' + name + '-solutions.zip">solutions</a>)';
    } else {
      renderedName = title + ' [' + name + ']';
    }

    renderedName = '<span style="width:25em;display:inline-block">' + renderedName + '</span>';
    renderedName += ' (due <strong>' + formatDate(dueDate) + '</strong>)';
    homeworks.push(renderedName);

    var files = ['submission.py', name + '.pdf'];
    assignments.push([name, title, dueDate, files]);
  }

  function project(name, title, numDaysTillDueDate) {
    if (!numDaysTillDueDate) numDaysTillDueDate = 8;
    var outDate = currentDate;
    var dueDate = advanceDate(currentDate, numDaysTillDueDate);

    var renderedName = '<a href="project.html#'+name+'">'+name+'</a>';
    addEvent(outDate, renderedName + ' ' + 'out'.fontcolor('green').bold());
    addDeadline(dueDate, renderedName + ' ' + 'due'.fontcolor('red').bold());

    renderedName = '<a href="project.html#'+name+'">'+title+' ['+name+']</a>';
    renderedName = '<span style="width:25em;display:inline-block">' + renderedName + '</span>';
    renderedName += '(due <strong>' + formatDate(dueDate) + '</strong>)';
    projects.push(renderedName);

    var files = [];
    if (name === 'p-peer')
      files.push(name.replace(/^p-/, '') + '.txt');
    else
      files.push(name.replace(/^p-/, '') + '.pdf');
    if (name != 'p-peer') {
      files.push('group.txt');
      files.push('title.txt');
    }
    if (name === 'p-proposal') {
      files.push('keywords.txt');
      files.push('cas.txt');
    }
    if (name === 'p-final') {
      files.push('code.zip');
      files.push('data.zip');
    }
    assignments.push([name, title, dueDate, files]);
  }

  function writeToHtml() {
    var hitDates = {};
    for (var i = 0; i < schedule.length; i++) {
      var tr = document.createElement('tr');
      var dateStr = schedule[i][0];
      hitDates[dateStr] = true;
    }

    // Insert events and deadlines into the schedule
    function insert(map, col) {
      for (var newDate in map) {
        newDate = parseInt(newDate);  // Javascript turns all keys into strings
        var newValue = map[newDate].join('<br/>');
        var added = false;
        for (var i = 0; i < schedule.length; i++) {
          var date = schedule[i][0];
          if (date == newDate) {
            schedule[i][col] = newValue;
            added = true;
            break;
          } else if (date > newDate) {
            var row = [newDate, formatDate(newDate), '', '', ''];
            row[col] = newValue;
            schedule.splice(i, 0, row);  // Insert
            added = true;
            break;
          }
        }
        if (!added) {
          var row = [newDate, formatDate(newDate), '', '', ''];
          row[col] = newValue;
          schedule.push(row);
        }
      }
    }
    insert(events, 4);
    insert(deadlines, 5);

    // Add things to the schedule
    var div = $('#schedule');
    var table = $('<table>');
    for (var i = 0; i < schedule.length; i++) {
      var tr = $('<tr>').addClass('highlightOnHover');
      var row = schedule[i].slice(1);
      for (var j = 0; j < 5; j++) {
        tr.append($('<td>').append(row[j]));
      }
      table.append(tr);
    }
    div.append(table);

    // Add things to homeworks
    var div = $('#homeworks');
    var ul = $('<ul>').appendTo(div);
    homeworks.forEach(function(text) {
      ul.append($('<li>').html(text));
    });
    div.append($('<br>'));

    // Add things to projects
    var div = $('#projects');
    var ul = $('<ul>').appendTo(div);
    projects.forEach(function(text) {
      ul.append($('<li>').html(text));
    });
  }

  function sectionLink(file, text) {
    return '<span class="pdflink">[<a href="sections/' + file + '">' + text + '</a>]</span>';
  }

  ////////////////////////////////////////////////////////////
  // https://registrar.stanford.edu/academic-calendar

  addEvent('Oct 11 2019', 'Drop date');
  addEvent('Nov 19 2019', 'Exam'.fontcolor('brown').bold());

  section('Introduction (Percy)', 'What is this class about?');

  nextClass(0);
  enableItem('Overview of course<br>Optimization', 'overview', [liveProgrammingLink('overview')]);
  closedHomework('foundations', 'Foundations', 8);

  nextClass(2);
  section('Machine learning (Percy)', 'Don\'t manually code it up, learn it from examples...');
  enableItem('Linear classification<br>Loss minimization<br>Stochastic gradient descent', 'learning1', [liveProgrammingLink('learning1')]);
  nextClass(1);
  enableItem('Section: optimization, probability, Python (review)', null, [sectionLink('section1.pdf', 'slides')], true);
  nextClass(4);

  closedHomework('sentiment', 'Sentiment classification');
  enableItem('Features and non-linearity<br>Neural networks, nearest neighbors', 'learning2');
  nextClass(2);
  enableItem('Generalization<br>Unsupervised learning, K-means', 'learning3', [liveProgrammingLink('learning3')]);
  nextClass(1);
  enableItem('Section: Backpropagation and SciKit Learn tutorial', null, [sectionLink('section2.pdf', 'slides'), sectionLink('sklearn_tutorial.ipynb', 'tutorial ipython notebook')], true);
  nextClass(4);

  section('Search (Dorsa)', 'Problem solving as finding paths in graphs...');
  enableItem('Tree search<br>Dynamic programming, uniform cost search', 'search1', [liveProgrammingLink('search1')]);
  closedHomework('reconstruct', 'Text reconstruction');

  nextClass(2);
  enableItem('A*, consistent heuristics<br>Relaxation', 'search2', [liveProgrammingLink('search2')]);
  nextClass(1);
  enableItem('Section: UCS,Dynamic Programming, A*', null, [sectionLink('section3.pdf', 'slides')], true);
  nextClass(4);

  section('Markov decision processes (Dorsa, Reid)', 'When nature intervenes randomly...');
  enableItem('Policy evaluation, policy improvement<br>Policy iteration, value iteration', 'mdp1', [liveProgrammingLink('mdp1')]);
  closedHomework('blackjack', 'Blackjack');
  project('p-proposal', 'Project proposal', 10);
  nextClass(2);
  enableItem('Reinforcement learning<br>Monte Carlo, SARSA, Q-learning<br>Exploration/exploitation, function approximation', 'mdp2');
  nextClass(1);
  enableItem('Section: deep reinforcement learning', null, [sectionLink('section4.pdf', 'slides')], true);
  nextClass(4);

  section('Game playing (Dorsa)', 'When an adversary intervenes...');
  closedHomework('pacman', 'Pac-Man');
  enableItem('Minimax, expectimax<br>Evaluation functions<br>Alpha-beta pruning', 'games1', [liveProgrammingLink('games1')]);
  nextClass(2);
  enableItem('TD learning<br>Game theory', 'games2');
  nextClass(1);
  enableItem('Section: Games', null, [sectionLink('section5.pdf', 'slides')], true);
  nextClass(4);

  section('Constraint satisfaction problems (Dorsa, Reid)', 'Problem solving as assigning variables (with constraints)...');
  closedHomework('scheduling', 'Course scheduling');
  enableItem('Factor graphs<br>Backtracking search<br>Dynamic ordering, arc consistency', 'csp1', [demoLink('inference-demo')]);
  nextClass(2);
  enableItem('Beam search, local search<br>Conditional independence, variable elimination', 'csp2');
  nextClass(1);
  enableItem('Section: CSPs', null, [sectionLink('section6.pdf', 'slides')], true);
  nextClass(4);

  section('Bayesian networks (Percy)', 'Representing uncertainty with probabilities...');
  enableItem('Probabilistic inference<br>Hidden Markov models', 'bayes1');
  closedHomework('car', 'Car tracking');
  project('p-progress', 'Project progress report', 10);
  nextClass(2);
  enableItem('Forward-backward<br>Particle filtering<br>Gibbs sampling', 'bayes2');
  nextClass(1);
  enableItem('Section: Bayesian networks', null, [sectionLink('section7.pdf', 'slides')], true);
  nextClass(4);
  enableItem('Learning Bayesian networks<br>Laplace smoothing<br>Expectation Maximization', 'bayes3', [liveProgrammingLink('bayes3')]);
  nextClass(2);

  section('Logic (Percy)', 'More expressive models...');
  enableItem('Syntax versus semantics<br>Propositional logic<br>Horn clauses', 'logic1');
  nextClass(1);
  disableItem('Section: Exam review 1<br>Reflex and State Based Models<br>Skilling Aud 3:30-4:20pm', null, [sectionLink('exam_review_slides_fall_2016.pdf', 'slides')], true);
  nextClass(1);
  enableItem('Section: Exam review 2<br>Variable Based Models<br>Skilling Aud 3:30-4:20pm', null, [sectionLink('section8-2.pdf', 'slides')], true);
  nextClass(3);

  enableItem('First-order logic<br>Resolution', 'logic2');
  closedHomework('logic', 'Language and logic');
  nextClass(2);
  section('Conclusion (Reid, Dorsa)', 'Reflections and prospects...');
  enableItem('Deep learning<br>autoencoders, CNNs, RNNs', 'deep');
  nextClass(1);
  // Aut2019 - Section 9 cancelled for extra midterm review session
  // disableItem('Section: semantic parsing (advanced)', null, [sectionLink('section9.pdf', 'slides')], true);

  nextClass(4);
  disableItem('(Thanksgiving &mdash; no class)');
  project('p-poster', 'Project poster session', 7);
  nextClass(2);
  disableItem('(Thanksgiving &mdash; no class)');
  nextClass(3);

  nextClass(2);

  project('p-peer', 'Project poster session (peer review)', 3);
  project('p-final', 'Project final report', 11);
  disableItem('Poster session<br>ACSR Basketball Courts', 'no-lecture');
  nextClass(2);
  enableItem('Summary, future of AI', 'conclusion');

  // Write specification to submit.json
  if (serverSide) {
    const assignmentsList = assignments.map(function (assign) {
      const id = assign[0];
      const title = assign[1];
      const dueDateObj = new Date(assign[2]);
      const dueDate = (dueDateObj.getYear() + 1900) + '-' + (dueDateObj.getMonth() + 1) + '-' + dueDateObj.getDate() + ' 23:01';
      const files = assign[3];
      const maxLateDays = id === 'p-final' ? 0 : 2;  // No late days for the final report
      return {id: id, title: title, dueDate: dueDate, files: files, maxLateDays: maxLateDays, maxSubmissions: 10, maxFileSizeMB: 20};
    });
    const root = {courseName: courseName, submissionsPath: submissionsPath, assignments: assignmentsList};
    console.log(JSON.stringify(root));
  } else {
    writeToHtml();
  }
}

if (serverSide)
  eventsOnLoad();
