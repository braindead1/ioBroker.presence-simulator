var schedules = [];
var selectId;

/**
 * Is called by the admin adapter when the settings page loads
 * @param {*} settings 
 * @param {*} onChange 
 */
function load(settings, onChange) {
    console.log("Loading settings");
    
    // Hide Settings
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

    // Get schedules
    schedules = settings.schedules || [];

    // Enhance GUI with events
    createEvents(onChange);

    onChange(false);

    // reinitialize all the Materialize labels on the page if you are dynamically adding inputs:
    if (M) M.updateTextFields();

    //Show Settings
    $('.hideOnLoad').show();
    $('.showOnLoad').hide();

    console.log("Loading settings done");
}

/**
 * Is called by the admin adapter when the user presses the save button
 * @param {*} callback 
 */
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

/**
 * Is called to enhance GUI with events
 * @param {*} onChange 
 */
function createEvents(onChange) {
    // Enhance Tabs with onClick event
    $('ul.tabs li a').on('click', function(){ 
        let tabId = $(this).attr('href');

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
    });

    // Enhance statesSelectedSchedule-Selectbox on States tab with onChange event
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
}

/**
 * Is called when tableStates table is ready to enhance SelectID buttons with onClick event
 */
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

/**
 * Is called to select IDs
 * @param {*} callback 
 */
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