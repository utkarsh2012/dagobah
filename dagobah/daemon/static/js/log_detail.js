stdoutLog('stdout');

function stdoutLog(stream) {
	$.getJSON($SCRIPT_ROOT + '/api/log',
		  {
			  job_name: jobName,
			  task_name: taskName,
			  log_id: logId
		  },
		  function(data) {
			  showLogText(stream, data['result'][stream], data['result']['start_time']);
		  }
	);
}


$('#stderr').click(function() {
	stdoutLog('stderr')
});

$('#stdout').click(function() {
	stdoutLog('stdout')
});

function showLogText(logType, value, start_time) {
	$('#log-detail').text(value);
	$('#log-detail').scrollTop(0);
	$('#log-detail').removeClass('hidden');
	$('#log-type').text(logType);
	$('#header').text($('#header').text() + ' - ' + start_time);
}