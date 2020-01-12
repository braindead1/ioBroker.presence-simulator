var selectId;

// This will be called by the admin adapter when the settings page loads
function load(settings, onChange) {
    // Hide Settings
    console.log("Loading settings");
    $('.hideOnLoad').hide();
    $('.showOnLoad').show();
    
    // example: select elements with id=key and class=value and insert value
    if (!settings) return;
    $('.value').each(function () {
        var $key = $(this);
        var id = $key.attr('id');
        if ($key.attr('type') === 'checkbox') {
            // do not call onChange direct, because onChange could expect some arguments
            $key.prop('checked', settings[id])
                .on('change', () => onChange())
                ;
        } else {
            // do not call onChange direct, because onChange could expect some arguments
            $key.val(settings[id])
                .on('change', () => onChange())
                .on('keyup', () => onChange())
                ;
        }
    });
    onChange(false);
    // reinitialize all the Materialize labels on the page if you are dynamically adding inputs:
    if (M) M.updateTextFields();

    //Get schedules
    schedules = settings.schedules || [];

    //Set initial values of further variables
    statesSelectedSchedule = -1;

    //++++++++++ TABS ++++++++++
    //Enhance Tabs with onShow-Function
    $('ul.tabs li a').on('click', function(){ onTabShow($(this).attr('href'));});
    function onTabShow(tabId){
        switch(tabId){
            case "#tabSchedules":
                //Fill Table
                values2table('tableSchedules', schedules, onChange);
                break;
            case "#tabStates":
                //Add Categories to Selectbox for Categories
                $('#statesSelectedSchedule').empty().append("<option disabled selected value>Select schedule</option>");
                schedules.forEach(function(element, index){
                    $('#statesSelectedSchedule').append("<option value='" + index + "'>" + element.name + "</option>"); 
                });
                $('select').select();

                //Reset statesSelectedSchedule
                statesSelectedSchedule = -1;
                $('#divStates').hide();
                break;
            case "#tabResult":
                //Show resulting JSON
                $('#result').empty().html(JSON.stringify(schedules, null, 4));
                break;
        }
    }

    //++++++++++ STATES ++++++++++
    //Enhance statesSelectedSchedule-Selectbox with functions
    $('#statesSelectedSchedule').on('change', function(){
        statesSelectedSchedule = $('#statesSelectedSchedule').val();

        if(statesSelectedSchedule > -1){
            //Fill Table
            if(!schedules[statesSelectedSchedule].states) {
                schedules[statesSelectedSchedule].states = [];
            }
            values2table('tableStates', schedules[statesSelectedSchedule].states, onChange, tableOnReady);
            
            $('#divStates').show();
        } else {
            $('#divStates').hide();
        }
    });

    function tableOnReady() {
        $('#tableStates .table-values .values-buttons[data-command="select_id"]').on('click', function () {
            let id = $(this).data('index');
            initSelectId(function (selectId) {
                selectId.selectId('show', $('#tableStates .values-input[data-name="id"][data-index="' + id + '"]').val(), function (newId) {
                    if (newId) {
                        $('#tableStates .values-input[data-name="id"][data-index="' + id + '"]').val(newId).trigger('change');
                    }
                });
            });
        });
    }

    //Show Settings
    console.log("Loading settings done");
    $('.hideOnLoad').show();
    $('.showOnLoad').hide();
}

// This will be called to select IDs
function initSelectId(callback) {
    if (selectId) {
        return callback(selectId);
    }
    socket.emit('getObjects', function (err, objs) {
        selectId = $('#dialog-select-member').selectId('init',  {
            noMultiselect: true,
            objects: objs,
            imgPath:       '../../lib/css/fancytree/',
            filter:        {type: 'state'},
            name:          'scenes-select-state',
            texts: {
                select:          _('Select'),
                cancel:          _('Cancel'),
                all:             _('All'),
                id:              _('ID'),
                name:            _('Name'),
                role:            _('Role'),
                room:            _('Room'),
                value:           _('Value'),
                selectid:        _('Select ID'),
                from:            _('From'),
                lc:              _('Last changed'),
                ts:              _('Time stamp'),
                wait:            _('Processing...'),
                ack:             _('Acknowledged'),
                selectAll:       _('Select all'),
                unselectAll:     _('Deselect all'),
                invertSelection: _('Invert selection')
            },
            columns: ['image', 'name', 'role', 'room']
        });
        callback(selectId);
    });
}

// This will be called by the admin adapter when the user presses the save button
function save(callback) {
    // example: select elements with class=value and build settings object
    var obj = {};
    $('.value').each(function () {
        var $this = $(this);
        if ($this.attr('type') === 'checkbox') {
            obj[$this.attr('id')] = $this.prop('checked');
        } else {
            obj[$this.attr('id')] = $this.val();
        }
    });            

    //Get edited subsettings
    obj.schedules = schedules;

    callback(obj);
}