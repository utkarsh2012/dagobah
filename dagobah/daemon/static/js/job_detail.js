var tasksTableHeadersTemplate = Handlebars.compile($('#tasks-table-headers-template').html());
var tasksTableResultsTemplate = Handlebars.compile($('#tasks-table-results-template').html());
var tasksTableCommandsTemplate = Handlebars.compile($('#tasks-table-commands-template').html());
var tasksTableTimeoutsTemplate = Handlebars.compile($('#tasks-table-timeouts-template').html());
var tasksTableRemoteTemplate = Handlebars.compile($('#tasks-table-remote-template').html());
var editTaskTemplate = Handlebars.compile($('#tasks-edit-template').html());

var tasksNameTemplate = Handlebars.compile($('#tasks-data-name-template').html());
var tasksCommandTemplate = Handlebars.compile($('#tasks-data-command-template').html());
var tasksSoftTimeoutTemplate = Handlebars.compile($('#tasks-data-soft-timeout-template').html());
var tasksHardTimeoutTemplate = Handlebars.compile($('#tasks-data-hard-timeout-template').html());
var tasksRemoteTargetTemplate = Handlebars.compile($('#tasks-data-remote-target-template').html());

Handlebars.registerPartial('tasksName', tasksNameTemplate);
Handlebars.registerPartial('tasksCommand', tasksCommandTemplate);
Handlebars.registerPartial('tasksSoftTimeout', tasksSoftTimeoutTemplate);
Handlebars.registerPartial('tasksHardTimeout', tasksHardTimeoutTemplate);
Handlebars.registerPartial('tasksRemoteTarget', tasksRemoteTargetTemplate);

var fieldMap = {
    "Task": 'name',
    "Command": 'command',
    "Soft Timeout": 'soft_timeout',
    "Hard Timeout": 'hard_timeout',
    "Remote Target": 'host_id',
};

var fieldTemplateMap = {
    "Task": tasksNameTemplate,
    "Command": tasksCommandTemplate,
    "Soft Timeout": tasksSoftTimeoutTemplate,
    "Hard Timeout": tasksHardTimeoutTemplate,
    "Remote Target": tasksRemoteTargetTemplate
};

function runWhenJobLoaded() {
    if (typeof job != 'undefined' && job.loaded === true) {
        resetTasksTable();
        var element =document.getElementById('cron-schedule');
        var cronSchedule = element.getAttribute("data-gmtValue");
        $('#cron-schedule').val(convertCronTimeZone(fromGmt=true, cronSchedule));
        setInterval(updateJobStatusViews, 500);
        setInterval(updateJobNextRun, 500);
        setInterval(updateTasksTable, 500);
        //Get hosts
        $.getJSON($SCRIPT_ROOT + '/api/hosts', {},
            function(result) {
                var options = $("#target-hosts-dropdown");
                $.each(result['result'], function() {
                    options.append($("<option />").val(this.host_id).text(this.host_name));
                });
            }
        );
    } else {
        setTimeout(runWhenJobLoaded, 50);
    }
}

runWhenJobLoaded();

function onTaskDeleteClick() {
    $(this).parents('[data-task]').each(function() {
        deleteTask($(this).attr('data-task'));
    });
}

function onEditTaskClick() {
    var td = $(this).parent();
    var tr = $(td).parent();

    $(td).children().remove();
    var original = $(td).text();

    var index = $(tr).children('td').index(td);
    var field = $('#tasks-headers > th:eq(' + index + ')').text();
    td.remove();

    if (index === 0) {
        tr.prepend(editTaskTemplate({ original: original, field: field }));
    } else {
        $(tr).children().each(function() {
            if ( $(tr).children().index(this) === (index - 1) ) {
                $(this).after(editTaskTemplate({
                    original: original,
                    field: field
                }));
            }
        });
    }

    $(tr).find('>:nth-child(' + (index + 1) + ')').find('input').select();
    bindEvents();

}

function editTask(taskName, field, newValue) {

    if (!job.loaded) {
        return;
    }

    var postData = {job_name: job.name, task_name: taskName};
    postData[fieldMap[field]] = newValue;

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/edit_task',
        data: postData,
        dataType: 'json',
        async: true,
        success: function() {
            if (fieldMap[field] === 'name') {
                $('tr[data-task="' + taskName + '"]').attr('data-task', newValue);
                job.renameTask(taskName, newValue);
            }
            showAlert('table-alert', 'success', 'Task changed successfully.');
        },
        error: function() {
            showAlert('table-alert', 'error', "There was a problem changing the task's information.");
        }
    });

}

function onSaveTaskEditClick() {

    var input = $(this).siblings('input');
    var field = $(input).attr('data-field');
    var original = $(input).attr('data-original');
    var newValue = $(input).val();

    var td = $(this).parent();
    var tr = $(td).parent();
    var index = $(tr).children('td').index(td);

    var taskName = $(tr).attr('data-task');

    if (original !== null && original !== newValue) {
        if (field == "Remote Target" || newValue !== '') {
            editTask(taskName, field, newValue);
        }
    } else {
        showAlert('table-alert', 'info', 'Task was not changed.');
        newValue = original;
    }

    td.remove();

    var template = fieldTemplateMap[field];

    if (index === 0) {
        tr.prepend(template({ text: newValue }));
    } else {
        $(tr).children().each(function() {
            if ( $(tr).children().index(this) === (index - 1) ) {
                $(this).after(template({ text: newValue }));
            }
        });
    }

    bindEvents();

}

function bindEvents() {

    $('.task-delete').off('click', onTaskDeleteClick);
    $('.task-delete').on('click', onTaskDeleteClick);

    $('.edit-task').off('click', onEditTaskClick);
    $('.edit-task').on('click', onEditTaskClick);

    $('.save-task-edit').off('click', onSaveTaskEditClick);
    $('.save-task-edit').on('click', onSaveTaskEditClick);

    $('.submit-on-enter').off('keydown', submitOnEnter);
    $('.submit-on-enter').on('keydown', submitOnEnter);

}

function deleteDependency(fromTaskName, toTaskName) {

    if (!job.loaded) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/delete_dependency',
        data: {
            job_name: job.name,
            from_task_name: fromTaskName,
            to_task_name: toTaskName
        },
        dataType: 'json',
        async: true,
        success: function() {
            job.removeDependencyFromGraph(fromTaskName, toTaskName);
            showAlert('graph-alert', 'success', 'Dependency from ' +
                      fromTaskName + ' to ' + toTaskName +
                      ' was successfully removed.');
        },
        error: function() {
            showAlert('graph-alert', 'error', 'There was an error removing this dependency.');
        }
    });

}

function deleteTask(taskName, alertId) {

    if (!job.loaded) {
        return;
    }

    if (typeof alertId === 'undefined') {
        alertId = 'table-alert';
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/delete_task',
        data: {
            job_name: job.name,
            task_name: taskName
        },
        dataType: 'json',
        async: true,
        success: function() {
            job.update(function() {
                resetTasksTable();
                job.removeTaskFromGraph(taskName);
            });
            showAlert(alertId, 'success', 'Task ' + taskName + ' deleted.');
        },
        error: function() {
            showAlert(alertId, 'error', 'There was an error deleting the task.');
        }
    });

}

$('#remote_checkbox').click(function () {
    $("#target_hosts").toggle(this.checked);
});

$('#add-task').click(function() {

    var newName = $('#new-task-name').val();
    var newCommand = $('#new-task-command').val();
    if ($('#remote_checkbox').is(':checked')){
        var newTargetHostId = $('#target-hosts-dropdown').val();
    }

    if (newName === null || newName === '') {
        showAlert('notes-alert', 'error', 'Please enter a name for the new task.');
        return;
    }
    if (newCommand === null || newCommand === '') {
        showAlert('notes-alert', 'error', 'Please enter a command for the new task.');
        return;
    }

    addNewTask(newName, newCommand, newTargetHostId);

});

$('#save-notes').click(function() {
    var notes = $('#job-notes').val();
    updateNotes(notes);
});

function updateNotes(newNotes) {
    if (!job.loaded) {
        return;
    }

    data = {
        job_name: job.name,
        notes: newNotes,
    };

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/update_job_notes',
        data: data,
        dataType: 'json',
        success: function() {
            showAlert('new-alert', 'success', 'Notes updated.');
        },
        error: function() {
            showAlert('new-alert', 'error', 'There was an error updating notes.');
        },
        async: true
    });
}

function addNewTask(newName, newCommand, newTargetHostId) {

    if (!job.loaded) {
        return;
    }

    if (newTargetHostId) {
        data = {
            job_name: job.name,
            task_name: newName,
            task_command: newCommand,
            task_target: newTargetHostId
        };
    } else {
        data = {
            job_name: job.name,
            task_name: newName,
            task_command: newCommand
        };
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/add_task_to_job',
        data: data,
        dataType: 'json',
        success: function() {
            showAlert('new-alert', 'success', 'Task added to job.');
            job.update(function() {
                job.addTaskToGraph(newName);
                resetTasksTable();
            });
            $('#new-task-name').val('');
            $('#new-task-command').val('');
            $('#target-hosts-dropdown').val('');
        },
        error: function() {
            showAlert('new-alert', 'error', 'There was an error adding the task to this job.');
        },
        async: true
    });
}

function resetTasksTable(tableMode) {

    if (!job.loaded) {
        return;
    }

    if (typeof tableMode === 'undefined') {
        tableMode = getTableMode();
    }

    $('#tasks-headers').empty();
    $('#tasks-body').empty();

    var headers=[];
    if (tableMode === 'results') {
        headers = ['Task', 'Started', 'Completed', 'Result', ''];
    } else if (tableMode === 'commands') {
        headers = ['Task', 'Command', ''];
    } else if (tableMode === 'timeouts') {
        headers = ['Task', 'Soft Timeout', 'Hard Timeout', ''];
    } else if (tableMode === 'remote') {
        headers = ['Task', 'Remote Target', ''];
    }

    for (var i = 0; i < headers.length; i++) {
        $('#tasks-headers').append(
            tasksTableHeadersTemplate({
                headerName: headers[i]
            })
        );
    }

    for (var i = 0; i < job.tasks.length; i++) {
        var thisTask = job.tasks[i];

        if (tableMode === 'results') {
            $('#tasks-body').append(
                tasksTableResultsTemplate({
                    taskName: thisTask.name,
                    taskURL: $SCRIPT_ROOT + '/job/' + job.id + '/' + thisTask.name
                })
            );
        } else if (tableMode === 'commands') {
            $('#tasks-body').append(
                tasksTableCommandsTemplate({
                    taskName: thisTask.name,
                    taskURL: $SCRIPT_ROOT + '/job/' + job.id + '/' + thisTask.name
                })
            );
        } else if (tableMode === 'timeouts') {
            $('#tasks-body').append(
                tasksTableTimeoutsTemplate({
                    taskName: thisTask.name,
                    taskURL: $SCRIPT_ROOT + '/job/' + job.id + '/' + thisTask.name
                })
            );
        } else if (tableMode === 'remote') {
            $('#tasks-body').append(
                tasksTableRemoteTemplate({
                    taskName: thisTask.name,
                    taskURL: $SCRIPT_ROOT + '/job/' + job.id + '/' + thisTask.name
                })
            );
        }

    }

    bindEvents();
    updateTasksTable();

}

function getTableMode() {
    return $('#table-toggle').children('.active').val();
}

$('#table-toggle').children().click(function() {
    resetTasksTable($(this).val());
});

function updateTasksTable() {

    if (!job.loaded) {
        return;
    }

    $('#tasks-body').children().each(function() {

        var taskName = $(this).attr('data-task');
        for (var i = 0; i < job.tasks.length; i++) {
            if (job.tasks[i].name === taskName) {
                var task = job.tasks[i];
                break;
            }
        }

        $(this).find('[data-attr]').each(function() {

            var attr = $(this).attr('data-attr');
            var transform = $(this).attr('data-transform');

            var descendants = $(this).children().clone(true);

            $(this).text('');
            if (task[attr] !== null) {
                $(this).text(task[attr]);
            }

            if (typeof transform === 'undefined' || transform === false) {
                // no transform attribute
            } else {
                applyTransformation($(this), task[attr], transform);
            }

            $(this).append(descendants);

        });

    });

}

function updateJobStatusViews() {

    if (!job.loaded) {
        return;
    }

    setControlButtonStates();
    $('#job-status')
        .removeClass('status-waiting status-running status-failed')
        .addClass('status-' + job.status)
        .text(toTitleCase(job.status));

}

function setControlButtonStates() {
    // disable control buttons based on current job state

    if (!job.loaded) {
        return;
    }

    $('#start-job').prop('disabled', false);
    $('#retry-job').prop('disabled', false);
    $('#terminate-job').prop('disabled', false);
    $('#kill-job').prop('disabled', false);

    if (job.status == 'waiting') {
        $('#terminate-job').prop('disabled', true);
        $('#kill-job').prop('disabled', true);
    } else if (job.status == 'running') {
        $('#start-job').prop('disabled', true);
    } else if (job.status == 'failed') {
        $('#terminate-job').prop('disabled', true);
        $('#kill-job').prop('disabled', true);
    }

}

function updateJobNextRun() {
    if (!job.loaded) {
        return;
    }

    if (job.next_run === null) {
        $('#next-run').val('Not scheduled');
    } else {
        $('#next-run').val(moment.utc(job.next_run).local().format('LLL'));
    }
}

$('#save-schedule').click(function() {

    if (!job.loaded) {
        return;
    }

    var cronSchedule = $('#cron-schedule').val();
    cronSchedule = convertCronTimeZone(fromGmt=false, cronSchedule);

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/schedule_job',
        data: {
            job_name: job.name,
            cron_schedule: cronSchedule
        },
        dataType: 'json',
        success: function () {
            showAlert('schedule-alert', 'success', 'Job scheduled successfully');
            updateJobNextRun();
        },
        error: function() {
            showAlert('schedule-alert', 'error', 'Unable to schedule job');
        },
        async: true
    });

});


function convertCronTimeZone(fromGmt, cronSchedule) {
    var cdate = new Date();
    var scheduleSplit = cronSchedule.split(" ");
    var hour = parseInt(scheduleSplit[1], 10);
    if (isNaN(hour)) {
        return cronSchedule;
    }
    if (fromGmt) {
        hour = hour - (cdate.getTimezoneOffset() /  60);
        if (hour < 0) {
            hour = hour + 24;
            if (scheduleSplit[4] != "*") {
                scheduleSplit[4] = parseInt(scheduleSplit[4], 10) - 1;
            }
        }
    } else {
        var offset = cdate.getTimezoneOffset() /  60;
        hour = hour + offset;
        if (hour >= 24) {   // double check the =
            hour = hour % 24;
            if (scheduleSplit[4] != "*") {
                scheduleSplit[4] = parseInt(scheduleSplit[4], 10) + 1;
            }
        }
    }
    scheduleSplit[1] = hour;
    var result = scheduleSplit[0];
    for (var i = 1; i < scheduleSplit.length; i++){
        result = result + " " + scheduleSplit[i];
    }
    return result;
}



$('#start-job').click(function() {

    if (!job.loaded) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/start_job',
        data: {job_name: job.name},
        dataType: 'json',
        success: function() {
            showAlert('state-alert', 'success', 'Job started');
        },
        error: function() {
            showAlert('state-alert', 'error', 'Unable to start job');
        },
        async: true
    });

});

$('#retry-job').click(function() {

    if (!job.loaded) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/retry_job',
        data: {job_name: job.name},
        dataType: 'json',
        success: function() {
            showAlert('state-alert', 'success', 'Retrying failed tasks');
        },
        error: function() {
            showAlert('state-alert', 'error', 'Unable to retry failed tasks');
        },
        async: true
    });

});

$('#terminate-job').click(function() {

    if (!job.loaded) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/terminate_all_tasks',
        data: {job_name: job.name},
        dataType: 'json',
        success: function() {
            showAlert('state-alert', 'success', 'All running tasks terminated');
        },
        error: function() {
            showAlert('state-alert', 'error', 'Unable to terminate some or all tasks');
        },
        async: true
    });

});

$('#kill-job').click(function() {

    if (!job.loaded) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $SCRIPT_ROOT + '/api/kill_all_tasks',
        data: {job_name: job.name},
        dataType: 'json',
        success: function() {
            showAlert('state-alert', 'success', 'All running tasks killed');
        },
        error: function() {
            showAlert('state-alert', 'error', 'Unable to kill some or all tasks');
        },
        async: true
    });

});

$('.toggle-help').click(function() {
    $('.chart-help').toggleClass('hidden');
});
