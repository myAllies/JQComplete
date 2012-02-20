var AutoCompleteData = null;
var SearchQueryTimeout;

(function($)
{
    $.fn.extend({
        autocomplete: function(acSettings)
        {
            var _acSettings = acSettings;
            
            

            var listdata = _acSettings.ListData;
            var watermark = _acSettings.WaterMark;
            var inittext = _acSettings.InitialText;
            var initvalue = _acSettings.InitialValue;
            var idfield = _acSettings.IDMember;
            var textfield = _acSettings.TextMember;
            var textfielddsec = _acSettings.DescMember;
            var ismodify = _acSettings.AllowModify;
            var serversearch = _acSettings.ServerSearch;
            var serverrequesttype = _acSettings.ServerRequestType;
            var hover_function = _acSettings.HoverFunction;

            this.UnfilterdList = null;

            return this.each(function()
            {
                new $.Autocompleter(this, listdata, watermark, inittext, initvalue, idfield, textfield, textfielddsec, ismodify, serversearch, serverrequesttype, hover_function);
            });
        },
        result: function(handler)
        {
            return this.bind("result", handler);
        },
        value: function(text, value)
        {
            if (value !== undefined && value != null)
            {
                $(this).find('input').val(text);
                $(this).find('input').data('ac_value', value);

                if (!IsEmptyOrNull(value))
                    $(this).find('.ac_watermark').hide();
                else
                    $(this).find('.ac_watermark').show();
            }
            var retPair = new Object();
            retPair.Text = $(this).find('input').val();
            retPair.Value = !IsEmptyOrNull($(this).find('input').data('ac_value')) ? $(this).find('input').data('ac_value') : "";
            return retPair;
        },
        disable: function()
        {
            $(this).find('input').attr("disabled", "disabled");
        },
        enable: function()
        {
            $(this).find('input').removeAttr('disabled');
        },
        inputFocus: function()
        {
            $(this).find('input').focus().blur().focus();
        }
    });

    $.Autocompleter = function(ac, listdata, watermark, inittext, initvalue, idfield, textfield, textfielddsec, ismodify, serversearch, serverrequesttype, hover_function)
    {


        $(ac).unbind();
        $(input).unbind();
        $(ac).html(construct_autocomplete(ac, watermark, inittext, ismodify, listdata == null, hover_function));

        var input = $(ac).find('input');
        var watermark = $(ac).find('.ac_watermark');
        $(watermark).bind("click", function(event)
        {
            $(this).hide();
            $(input).focus();
        });

        $(input).bind("focus", function(event)
        {
            $(watermark).hide();
            $(this).click();
        });

        input.data('ac_value', initvalue);

        if (ismodify)
        {
            $(ac).find('input').bind("blur", function(event)
            {
                setTimeout(function()
                {
                    if (IsEmptyOrNull($(input).val()))
                    {
                        $(input).parent().parent().find('.ac_watermark').show();
                    }
                    else
                    {
                        $(input).parent().parent().find('.ac_watermark').hide();
                    }
                }, 0);
            });
        }

        $(ac).bind("click", function(event)
        {
            if (ac.UnfilterdList == null)
                ac.UnfilterdList = listdata;

            $('.ac_list').hide();
            $('.ac_tip').hide();
            var irow = 0;
            var html = '<ul>';

            if (listdata == null || listdata.length < 1)
                return;
            for (var i = 0; i < listdata.length; i++)
            {
                var hover;

                if (hover_function)
                {
                    hover = 'onmouseover=' + hover_function + '("' + listdata[i][idfield] + '"); ';
                }

                var rowclass = irow % 2 == 0 ? 'odd' : 'even';
                html += '<li acid=' + listdata[i][idfield] + ' class=' + rowclass + ' ' + hover + '><div style="float:left;padding-right:5px;">' + listdata[i][textfield] + '</div><div style="color:grey;font-size:90%;">' + listdata[i][textfielddsec] + '</div></li>';
                irow++;
            }

            html += '</ul>';

            $('#' + (ac.id) + ' .ac_wrapper .ac_list').html(html);

            if ($('#' + (ac.id) + ' .ac_wrapper .ac_upper input').attr("disabled") != "disabled")
                $('#' + (ac.id) + ' .ac_wrapper .ac_list').show();

            registerUpDown(ac);

            $('#' + (ac.id) + ' .ac_wrapper .ac_list ul li').bind("click", function(event)
            {
                select_ac_item(event, false);
            });
        });

        $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').bind("keyup", function(e)
        {
            clearTimeout(SearchQueryTimeout);

            e = e || window.event;
            if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13)
            {
                return;
            }
            if (serversearch)
                SearchQueryTimeout = setTimeout(function() { update_keyup(ac, serverrequesttype); }, 250);
            else
                update_keyup(ac, serverrequesttype);

        });

        function update_keyup(ac, serverrequesttype)
        {
            var input = $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').val();
            var temp = new Array();
            clearTimeout(SearchQueryTimeout);
            if (serversearch)
            {
                $.ajax({
                    type: 'POST',
                    url: '/Handler.ashx?r=' + serverrequesttype,
                    data: JSON.stringify(input),
                    dataType: 'json',
                    async: false,
                    success: process_ac_change_data,
                    error: eval(errorHandler)
                });
            }

            else
            {
                $.each(ac.UnfilterdList, function(i)
                {
                    if (ac.UnfilterdList[i][textfield].toString().toLowerCase().indexOf(input.toLowerCase()) != -1 || ac.UnfilterdList[i][textfielddsec].toString().toLowerCase().indexOf(input.toLowerCase()) != -1)
                    {
                        temp.push(this);
                    }

                });

                listdata = temp;
            }

            var irow = 0;
            var html = '<ul>';

            if (listdata != null)
                $.each(listdata, function(i, rowitem)
                {
                    var hover;

                    if (hover_function)
                    {
                        hover = 'onmouseover=' + hover_function + '("' + rowitem[idfield] + '"); ';
                    }

                    var rowclass = irow % 2 == 0 ? 'odd' : 'even';
                    html += '<li acid=' + rowitem[idfield] + ' class=' + rowclass + ' ' + hover + '><div style="float:left;padding-right:5px;" >' + rowitem[textfield] + '</div><div style="color:grey;font-size:90%;">' + rowitem[textfielddsec] + '</div></li>';
                    irow++;

                });

            html += '</ul>';

            $('#' + (ac.id) + ' .ac_wrapper .ac_list').html(html);
            $('#' + (ac.id) + ' .ac_wrapper .ac_list').show();
            registerUpDown(ac);

            $('#' + (ac.id) + ' .ac_wrapper .ac_list ul li').bind("click", function(event)
            {
                select_ac_item(event, false);
            });
            return true;
        }

        function registerUpDown(ac)
        {
            $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').unbind("keydown");
            ac.pointer = null;
            ac.parentDiv = $('#' + (ac.id) + ' .ac_wrapper .ac_list');
            ac.list = ac.parentDiv.find('li');

            $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').bind("keydown", function(e)
            {
                e = e || window.event;
                switch (e.keyCode)
                {
                    case 38: //up                
                        ac.select_li(-1);
                        break;
                    case 40: //down
                        ac.select_li(1);
                        break;
                    case 13: //Enter
                        select_ac_item(ac.list[ac.pointer], true);
                        break;
                }
            });

            var scrolLength;
            ac.nli = 0;

            ac.select_li = function(inc)
            {

                if (ac.pointer > 0)
                {
                    scroll_li(ac);
                }
                if (ac.pointer == 0)
                    ac.parentDiv.scrollTop = 0;
                if (ac.pointer !== null && ac.pointer + inc >= 0 && ac.pointer + inc < ac.list.length)
                {
                    ac.list[ac.pointer].className = '';
                    ac.pointer += inc;
                    ac.list[ac.pointer].className = 'ac_active';
                }
                if (ac.pointer === null)
                {
                    ac.pointer = 0;
                    scrolLength = 18.9;
                    ac.list[ac.pointer].className = 'ac_active';
                }

                if (!IsEmptyOrNull(hover_function))
                {
                    new Object(hover_function + "('" + $(ac.list[ac.pointer]).attr('acid') + "')");
                }
            }
            function scroll_li(ac)
            {
                var areaheight = 300
                var tempheight = 0;
                var slicecounter = ac.pointer - ac.nli > 0 ? ac.pointer - ac.nli : 0;

                $.each(ac.parentDiv.find('li').slice(slicecounter), function(i, lirow)
                {
                    tempheight += $(lirow).outerHeight();

                    if (tempheight >= 300)
                    {
                        ac.nli = i - 1;
                        return false;
                    }
                });


                if (window.event.keyCode == 40)
                {
                    if (ac.pointer - ac.nli > 0)
                        $(ac.parentDiv).scrollTop((ac.pointer - ac.nli) * scrolLength);
                }
                else if (window.event.keyCode == 38)
                {
                    if ($(ac.parentDiv).scrollTop() / (ac.pointer - 2) > scrolLength || $(ac.parentDiv).scrollTop() / (ac.pointer - 2) < 0)
                        $(ac.parentDiv).scrollTop((ac.pointer - 1) * scrolLength);
                }
            }
        }

        function select_ac_item(e, isobject)
        {
            if (e != null)
            {
                var ele = isobject ? e : (e.target || window.event.srcElement);

                var selectedid;
                var selectedtext;

                if (ele.nodeName.toLowerCase() == "div")
                {
                    selectedid = $(ele).parent().attr("acid");
                    selectedtext = $(ele).parent().find("div").eq(0).text();
                }
                else
                {
                    selectedid = selectedid = $(ele).attr("acid");
                    selectedtext = $(ele).find("div").eq(0).text();
                }

                $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').val(selectedtext);
                $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').data('ac_value', selectedid);

                $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').addClass('ac_selected');

                $(ac).trigger("result", [selectedid, selectedtext]);
            }

            $('.ac_list').live("click", function()
            {
                $('.ac_list').hide();
                $('.ac_tip').hide();

            });
            $('#' + (ac.id) + ' .ac_wrapper .ac_upper input').parent().parent().find('.ac_watermark').hide();
            $('#' + (ac.id) + ' .ac_wrapper .ac_list').hide();
            $('#' + (ac.id) + ' .ac_wrapper .ac_tip').hide();

            return true;
        }

        function process_ac_change_data(serverdata)
        {
            AutoCompleteData = serverdata;
            listdata = serverdata;
        }
        function construct_autocomplete(container, watermark, text, ismodify, isemptylist)
        {
            var readonly = ismodify ? '' : 'readonly';
            var readonlycursor = ismodify ? 'auto' : 'pointer';
            var inputclass = 'ac_input_readonly';
            var bgstyle;
            watermark = watermark == null ? '' : watermark;
            text = text == null ? '' : text;

            if (isemptylist)
                bgstyle = '';
            else
                bgstyle = 'background: url(/images/ac_arrowdown.gif)';

            var id = 'input_' + $(container).attr('id');

            var html = '<div class="ac_wrapper">' +
                    '<div class="ac_upper">' +
                           '<div style=" ' + bgstyle + ' no-repeat right; width:100%;"><input class=\"' + inputclass + '\" id=\"' + id + '\" ' + '\" name=\"' + id + '\" ' + '\" value=\"' + text + '\" ' + readonly + ' type="text" style="cursor:' + readonlycursor + ';margin:0; border: none 0px;width:90%;" autocomplete="off"/></div>' +
                           '<div class="ac_watermark">' + watermark + '</div>' +
                   '</div>' +
                   '<div class="ac_tip" id="' + id + '_tip"><div id="' + id + '_tip_content"></div></div>' +
                   '<div class="ac_list">' +
                   '</div>' +
                   '<div id=\"validator-' + id + '\" class="validation_container"><div>' +
               '</div>';
            $('.ac_list').hide();
            $('.ac_tip').hide();

            return html;
        }
    };
})(jQuery);