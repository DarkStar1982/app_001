$(document).ready(function(){
  // init input masks
  $("#field1").mask('000');
  $("#field2").mask('000,000,000,000,000.00', {reverse: true});
  namespace_iplanner.init_page_state();
  //page event handlers
  $("#get_score").on('click', function(e){
    namespace_iplanner.get_profile();
  });

  $("#get_pdf_report").on('submit', function (e){
    namespace_iplanner.return_report_data();
  });

  $("#recalculate").on('click', function(e){
    namespace_iplanner.show_export_view();
  });

  $("#get_positions_as_csv").on('submit', function(e){
   namespace_iplanner.get_csv_file();
 });

  namespace_marketdata.load_data();
});

var namespace_marketdata = (function(){
  var API_URL = "/data_api";

  var stock_database = {};
  var benchmark_database = {};

  return {
    get_data: function(p_symbol)
    {
      return stock_database[p_symbol];
    },

    load_data: function()
    {
      $.getJSON(API_URL,  {call:"stock_list",}, function(data)
      {
        var stock_list = data.contents.stocks;
        var benchmark_list = data.contents.benchmarks;
        for (var i=0;i<stock_list.length;i++)
        {
            stock_database[stock_list[i]["value"]] = {
              "ticker" : stock_list[i]["value"],
              "currency" : stock_list[i]["currency"],
              "type" : stock_list[i]["type"],
              "desc" : stock_list[i]["desc"]
            }
        }
        $.each(benchmark_list, function(index, obj){
          benchmark_database[obj["value"]] = {
            "ticker":obj["value"],
            "description": obj["label"]
          };
          $("#benchmark_list").append('<option value='+index+'>'+obj["value"]+'</option>');
        });
      });
    }
  }

}) ();

var namespace_portfolio_report = (function(){

  return {
    get_report_pdf: function()
    {

    }
  }

}) ();

var namespace_portfolio_aux = (function(){
  return {

    compute_risk_decomposition_table: function(p_data, p_derived_data, p_risk_data, p_net_data, p_correlations, porfolio_corr)
    {
      var risk_comp_table=[];
      var d_risk = 1.0;
      var ret_sum = 0.0;
      var p_risk = p_risk_data[0][0][1];// p_derived_data[0]["std_dev"];
      var x_risk = Math.pow(p_risk, 2);
      $.each(p_data, function(index, value){
        var n_ret = p_net_data["positions"][index]["pnl_rel"];
        var n_weight = math_util.aux_math_round((p_net_data["positions"][index]["last_value"]/p_net_data["total_value"]),2);
        var n_contrib = math_util.aux_math_round(p_net_data["positions"][index]["pnl"] /p_net_data["total_value"]*100,2);
        var n_risk = math_util.aux_math_round(p_data[index]["risk_values"][0][0][1],2);
        ret_sum = ret_sum + n_contrib;
        var c_risk = math_util.aux_math_round((Math.pow(n_weight,2) * Math.pow(n_risk,2)) / Math.pow(p_risk,2),2);
        d_risk = d_risk - c_risk;
        x_risk = x_risk - c_risk;
        risk_comp_table.push([
          value["symbol"],
          namespace_html.display_as_percentage(math_util.aux_math_round(n_ret,2)),
          namespace_html.display_as_percentage(math_util.aux_math_round(n_weight*100,2)),
          namespace_html.display_as_percentage(math_util.aux_math_round(n_contrib,2)),
          namespace_html.display_as_percentage(math_util.aux_math_round(n_risk*100,2)),
          math_util.aux_math_round(p_correlations[value["symbol"]],2)
        ]);
      });
      d_risk = math_util.aux_math_round(d_risk, 2);
      var port_return = math_util.aux_math_round(p_derived_data[0]["diff_percent"], 2);
      var net_weight = 1.0;
      var net_risk = 1.0;
      risk_comp_table.push([
        'Portfolio',
        namespace_html.display_as_percentage(math_util.aux_math_round(port_return,2)),
        namespace_html.display_as_percentage(math_util.aux_math_round(net_weight*100.0,2)),
        namespace_html.display_as_percentage(math_util.aux_math_round(ret_sum,2)),
        namespace_html.display_as_percentage(math_util.aux_math_round(p_risk*100,2)),
        math_util.aux_math_round(porfolio_corr,2)
        ]);
      return risk_comp_table;
    },

    get_position_chart_data: function(p_series_data, p_net_value)
    {
        function format_position(p_symbol)
        {
          return p_symbol.replace('_B','');
        }
        var abs_list=[];
        var rel_list=[];
        var info_obj_abs = {};
        var info_obj_rel = {};
        var data_positions_abs=[];
        var data_positions_rel=[];
        var bubbles_a=[];
        var bubbles_b=[];
        var max_pnl = 0.0;
        var max_pnl_rel = 0.0;
        for (var j=0;j<p_series_data.length;j++)
        {
          if (p_series_data[j].pnl<0)
            bubbles_a.push([j,p_series_data[j].pnl,"red"]);
          else
            bubbles_a.push([j,p_series_data[j].pnl,"green"]);
      if (p_series_data[j].pnl_rel<0)
        bubbles_b.push([j,p_series_data[j].pnl_rel,"red"]);
      else
        bubbles_b.push([j,p_series_data[j].pnl_rel,"green"]);
      if (Math.abs(p_series_data[j].pnl)>max_pnl) max_pnl = Math.abs(p_series_data[j].pnl);
      if (Math.abs(p_series_data[j].pnl_rel)>max_pnl_rel) max_pnl_rel = Math.abs(p_series_data[j].pnl_rel);

    }
    bubbles_a.sort(function(a,b){
      if (a[1]<b[1]) return -1;
      if (a[1]>b[1]) return 1;
      if (a[1]==b[1]) return 0;
    });
    bubbles_b.sort(function(a,b){
      if (a[1]<b[1]) return -1;
      if (a[1]>b[1]) return 1;
      if (a[1]==b[1]) return 0;
    });
    for (var i=0;i<bubbles_a.length;i++)
    {
      abs_list.push({"x":i,"y":p_series_data[bubbles_a[i][0]].pnl,"color":bubbles_a[i][2]});
      data_positions_abs.push(format_position(p_series_data[bubbles_a[i][0]].symbol));
            info_obj_abs[p_series_data[bubbles_a[i][0]].symbol] = {
                "volume": p_series_data[bubbles_a[i][0]].volume,
                "xpnl": p_series_data[bubbles_a[i][0]].pnl,
                "rpnl": p_series_data[bubbles_a[i][0]].pnl_rel
            };
          rel_list.push({"x":i,"y":p_series_data[bubbles_b[i][0]].pnl_rel,"color":bubbles_b[i][2]});
      data_positions_rel.push(format_position(p_series_data[bubbles_b[i][0]].symbol));
            info_obj_rel[p_series_data[bubbles_b[i][0]].symbol] = {
                "volume": p_series_data[bubbles_b[i][0]].volume,
                "xpnl": p_series_data[bubbles_b[i][0]].pnl,
                "rpnl": p_series_data[bubbles_b[i][0]].pnl_rel
            };
        }

        return {
      "abs_list":abs_list,
      "rel_list":rel_list,
      "data_positions": [data_positions_abs, data_positions_rel],
      "hash_table":[info_obj_abs, info_obj_rel],
      "max_pnl":max_pnl,
      "max_pnl_rel":max_pnl_rel};
    },

    compute_net_data: function(position_data)
    {
        var total_cash = position_data.total_cash;
        var start_cash = position_data.start_cash;
        var cash_change = parseFloat(total_cash - start_cash);
        var position_list =[];
        var profit_or_loss = 0.0;
        var net_profit = 0.0;
        var total_pnl = 0.0;
        var net_value = 0.0;
        var net_data = position_data.net_positions;
        for (var k in net_data)
        {
            if (net_data.hasOwnProperty(k))
            {
                var avg_price = parseFloat(net_data[k][1] / net_data[k][0]);
                if (k.indexOf("_S")>-1)
                {
                    profit_or_loss = - parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = profit_or_loss + net_value;
                }
                else
                {
                    profit_or_loss = parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = net_data[k][2] + net_value;
                }
                if (net_data[k][0]>0)
                {
                    position_list.push({"symbol": k,
                                        "volume": net_data[k][0],
                                        "price_avg": math_util.aux_math_round(avg_price,2),
                                        "book_value": math_util.aux_math_round(net_data[k][1],2),
                                        "last_value": math_util.aux_math_round(net_data[k][2],2),
                                        "pnl": math_util.aux_math_round(profit_or_loss,2),
                                        "pnl_rel":math_util.aux_math_round(profit_or_loss / net_data[k][1] * 100.0, 2),
                                        "sector":net_data[k][3]
                    });
                }
                total_pnl = total_pnl + profit_or_loss;
             }
        }
        if (position_list.length == 0)
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-"};
            var end_totals = total_cash;
            total_pnl = "-";
        }
        else
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-" };
            var end_totals = math_util.aux_math_round(total_cash + net_value,2);
            total_pnl = math_util.aux_math_round(total_pnl,2);
        }
        return {"positions": position_list, "net_cash_row":cash_row, "total_value" : end_totals, "total_pnl": total_pnl};
    },

    compute_position_data: function(p_transactions)
    {
        var total_cash = 0.0;
        var start_cash = 0.0;
        var net_data = new Object();
        for (var i=0;i<p_transactions.length;i++)
        {
            var row_data = p_transactions[i];
            switch (row_data.type)
            {
                case "Deposit":
                    total_cash = total_cash + parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    start_cash = total_cash;
                    break;
                case "Withdraw":
                    total_cash = total_cash - parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    break;
                case "Buy":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    total_cash =  total_cash - book_value;
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value] = [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Sell":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        if (volum_diff>=0)
                        {
                            total_cash = total_cash + book_value;
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else console.log("not a valid action - can't sell more then you hold");
                    }
                    else console.log("not a valid action - can't sell what you don't have");
                    break;
                case "Short":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    var hash_value = row_data.asset+'_S';
                    total_cash =  total_cash - book_value;
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value]= [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Cover":
                    var hash_value = row_data.asset+'_S';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        var book_value = row_data.volume*book_price;
                        if (volum_diff>=0)
                        {
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            total_cash = total_cash + book_value - row_data.volume*(row_data.book_price - book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else console.log("Can't cover more than you have in a short position" );
                    }
                    else console.log("No short position found to cover");
                    break;
            }
        }
        //namespace_gui.send_log_message("start cash is "+  start_cash, "Info");
        return { "net_positions" : net_data, "total_cash": math_util.aux_math_round(total_cash,2), "start_cash" : start_cash };
      }
  }
}) ();

var namespace_iplanner = (function(){
  var p_data = {};
  var p_data_extended = {};
  var p_csv_positions = {};
  var API_URL = "/data_api";
  var portfolio_string = "";

  var saved_charts = {
    "allocation_chart" : {},
    "detailed_allocations" : {}
  };

  var saved_tables = {
    "positions_fixed" : {},
    "positions_equity" : {},
    "performance_year" : {},
    "risk_table" : [],
    "computed_positions" : []
  }
  function compute_profile_score(p_rank_value)
  {
    var investor_profile = {};
    investor_profile["score"] = p_rank_value;
    if (p_rank_value<16)
    {
      investor_profile["title"] = "Conservative&nbsp;Investor";
      investor_profile["Description"] = "You primary objective is the preservation of capital with minimal risk."
        + "You can allow only short amount of time for portfolio to recover from negative period";
    }
    else if (p_rank_value<24)
    {
      //balanced
      investor_profile["title"] = "Income&nbsp;Investor";
      investor_profile["Description"] = "You are willing to tolerate some market fluctuations for the better returns.";
    }
    else if ((p_rank_value>=24)&&(p_rank_value<=30))
    {
      //growth
      investor_profile["title"] = "Balanced&nbsp;Investor";
      investor_profile["Description"] = "You are willing to tolerate market fluctuations and more time for the market to recover value."
        + "You have some experience with investments and you understand tradeoff betwee market risks and returns.";
    }
    else if (p_rank_value>30)
    {
      //aggressive growth
      investor_profile["title"] = "Growth&nbsp;Investor";
      investor_profile["Description"] = "You are a knowledgeable investor and not concerned about short-term fluctuations"
        + "You are willing to wait longer time to maximize your profits.";
    }
    return investor_profile;
  }

  function compute_portfolio_data(score)
  {
    //append charts here
    if (score<16)
    {
      p_data["basic"] = [
        {name:'EQ',color:'#00EF7F', y:0.00},
        {name:'FI',color:'#007F7F',y: 100.00}
      ];
      portfolio_string = "x1a1"+datetime_util.get_date_as_string();
    }
    else if (score<24)
    {
      p_data["basic"] = [
        {name:'EQ',color:'#00EF7F', y: 15.00},
        {name:'FI',color:'#007F7F',y: 85.00}
      ];
      portfolio_string = "x1a2"+datetime_util.get_date_as_string();
    }
    else if ((score>=24)&&(score<=30))
    {
      p_data["basic"] = [
        {name:'EQ',color:'#00EF7F', y:60.00},
        {name:'FI',color:'#007F7F',y: 40.00}
      ];
      portfolio_string = "x1a3"+datetime_util.get_date_as_string();
    }
    else if (score>30)
    {
      p_data["basic"] = [
        {name:'EQ',color:'#00EF7F', y:80.00},
        {name:'FI',color:'#007F7F',y: 20.00}
      ];
      portfolio_string = "x1a4"+datetime_util.get_date_as_string();
    }
    return p_data;
  }

  function create_detailed_series(p_score)
  {
    //append charts here
    if (p_score<16)
    {
      p_data_extended["basic"] = [[
          ['AGG', 40.0],
          ['IEF', 30.0],
          ['IEI', 10.0],
          ['TLH', 10.0],
          ['SHY', 5.0],
          ['HYG', 5.0]
        ],
        [
          {name:'AGG', color: '#007F7F', y:40.0},
          {name:'IEF', color: '#007F7A', y:30.0},
          {name:'IEI', color: '#007F77', y:10.0},
          {name:'TLH', color: '#007F70', y:10.0},
          {name:'SHY', color: '#007F6B', y:5.0},
          {name:'HYG', color: '#007F67', y:5.0}
        ]
      ];
    }
    else if (p_score<24)
    {
      p_data_extended["basic"] = [[
        ['AGG', 40.0],
        ['TLH', 20.0],
        ['PFF', 10.0],
        ['HYG', 10.0],
        ['EFV', 10.0],
        ['DVY', 10.0],
	],
        [
          {name:'EFV', color: '#00EF7F', y:10.0},
          {name:'DVY', color: '#00EF77', y:10.0},
          {name:'AGG', color: '#007F7F', y:40.0},
          {name:'TLH', color: '#007F7A', y:20.0},
          {name:'PFF', color: '#007F77', y:10.0},
          {name:'HYG', color: '#007F70', y:10.0},
        ]
      ];
    }
    else if ((p_score>=24)&&(p_score<=30))
    {
      p_data_extended["basic"] = [[
        ['VOO', 20.0],
        ['IVE', 10.0],
        ['IWV', 10.0],
        ['AGG', 20.0],
        ['HYG', 5.0],
        ['TLH', 20.0],
        ['PFF', 10.0],
        ['EFA', 5.0]],
        [
          {name:'VOO', color: '#00EF7F', y:20.0},
          {name:'IVE', color: '#00EF7B', y:10.0},
          {name:'IWV', color: '#00EF77', y:10.0},
          {name:'TLH', color: '#00EF74', y:20.0},
          {name:'EFA', color: '#00EF70', y:5.0},
          {name:'AGG', color: '#007F7F', y:20.0},
          {name:'HYG', color: '#007F7B', y:5.0},
          {name:'PFF', color: '#007F77', y:10.0}
        ]];
    }
    else if (p_score>30)
    {
      p_data_extended["basic"] = [[
        ['VOO', 20.0],
        ['IJR', 5.0],
        ['IVE', 10.0],
        ['IWV', 15.0],
        ['AGG', 10.0],
        ['HYG', 5.0],
        ['EFV', 15.0],
        ['EFA', 10.0],
        ['TLH', 5.0],
        ['QQQ', 5.0]],
        [
          {name:'VOO', color: '#00EF7F', y:20.0},
          {name:'IJR', color: '#00EF7B', y:5.0},
          {name:'IVE', color: '#00EF77', y:10.0},
          {name:'IWV', color: '#00EF74', y:15.0},
          {name:'EFV', color: '#00EF6B', y:15.0},
          {name:'EFA', color: '#00EF67', y:10.0},
          {name:'QQQ', color: '#00EF7F', y:5.0},
          {name:'AGG', color: '#007F7F', y:10.0},
          {name:'TLH', color: '#007F7F', y:5.0},
          {name:'HYG', color: '#007F7F', y:5.0},
        ]
      ];
    }
    return p_data_extended;
  }

  function compute_chart_series(p_data)
  {
    var p_data_ex = {"basic":[]};
    for (var i=0;i<p_data["basic"].length;i++)
    {
      if (p_data["basic"][i][1] > 0.0)
        p_data_ex["basic"].push(p_data["basic"][i]);

    }
    return p_data_ex;
  }

  function create_charts_pie(p_data, p_title)
  {
    var chart_objs = [{
      title : { text : p_title},
      legend : {enabled: false},
      series: [{
            type: 'pie',
            name: 'Portfolio share',
            //innerSize: '50%',
            data:p_data
        }]
    }];
    saved_charts["allocation_chart"]  = chart_objs[0];
    return chart_objs;
  }

  function create_charts_bar(p_data, p_title)
  {
    var formatted_data = [];
    var chart_objs = [{
      title : { text : p_title},
      legend : {enabled:false},
      series: [{
            type: 'pie',
            name: 'Portfolio share',
            data: p_data
        }]
    }];
    saved_charts["detailed_allocations"] = chart_objs[0];
    return chart_objs;
  }


  function cell_macro(p_value)
  {
    var cell = "<td>" + p_value + "</td>";
    return cell;
  }

  function row_macro(p_values)
  {
    var row = "";
    for (var i=0;i<p_values.length;i++)
    {
      row = row + cell_macro(p_values[i]);
    }
    row = "<tr>" + row + "</tr>";
    return row;
  }

  function append_tables_advanced(p_data)
  {
    var rows="";
    var rows_2="";
    saved_tables["positions_fixed"] = [["Symbol", "Market","Description", "Weight"]];
    saved_tables["positions_equity"] = [["Symbol", "Market","Description", "Weight"]];

    for (var i=0;i<p_data.length;i++)
    {
      var symbol_data  = namespace_marketdata.get_data(p_data[i][0]);
      var new_row = row_macro([
        symbol_data["ticker"],
        symbol_data["currency"],
      //  symbol_data["type"],
        symbol_data["desc"],
        p_data[i][1] +'%'
      ]);
      if (symbol_data["type"] == "Fixed Income")
      {
        rows = rows + new_row;
        saved_tables["positions_fixed"].push([
          symbol_data["ticker"],
          symbol_data["currency"],
          symbol_data["desc"],
          p_data[i][1] +'%'
        ]);
      }
      else if (symbol_data["type"] == "Equity")
      {
        rows_2 = rows_2 + new_row;
        saved_tables["positions_equity"].push([
          symbol_data["ticker"],
          symbol_data["currency"],
          symbol_data["desc"],
          p_data[i][1] +'%'
        ]);
      }
    }

    $("#table_3 tbody").empty();
    $("#table_3 tbody").append(rows);
    $("#table_3").show();
    $("#table_31 tbody").empty();
    $("#table_31 tbody").append(rows_2);
    $("#table_31").show();
  }

  function render_risk_decomposition_table(p_container_id, p_risk_data)
  {
    saved_tables["risk_table"] = [];
    saved_tables["risk_table"].push(["Symbol", "Nominal Ret", "Weight", "Return Contrib.", "Nominal Risk" /* "Risk contrib." */])
    $(p_container_id).empty()
    $.each(p_risk_data, function(index, value)
    {
      var row = [];
      saved_tables["risk_table"].push(value);
      $.each(value, function(i,v){
        row.push(namespace_html.create_table_cell(v,"col-md-2"));
      });
      $(p_container_id).append(namespace_html.create_table_row(row,null));
    });
  }

  //request portfolio series from net data and transactions
  function render_charts(p_data_transactions, p_net_data)
  {
    var p_data_positions = p_net_data["positions"];
    var p_total_value = p_net_data["total_value"];
    var post_data = JSON.stringify({
      "transactions": p_data_transactions,
      "positions": p_data_positions,
      "portfolio_id": portfolio_string
    });
    var current_benchmark = $("#benchmark_list :selected").text();
    var start_date = datetime_util.adjust_date(datetime_util.get_shifted_year_date(3)); //.(today);

    if (p_data_transactions.length>0) $.post('/data_api/', {call:"portfolio_series", data: post_data}, function(data)
    {
      var json_data = JSON.parse(data);
      if (json_data.header.error_code == 0)
      {
        $.getJSON('/data_api/', {call:"benchmark_series", symbol: current_benchmark, start_date: start_date}, function(b_data)
        {
          var series_data = [];
          series_data[0]={
            "name":"Portfolio",
            "data":json_data.norm_pnl_split,
            type:'line'
          };
          series_data[1]={
                    name: current_benchmark,
                    data: b_data["norm_value_split"],
                    type: 'line',
                    dashStyle: 'dot'
                  };
          namespace_graphs.render_performance_chart(series_data, "#chart_container_3");
          // for each symbol compute correlation with benchmark_series
          var correlations = {};
          $.each(json_data.position_value_series, function(index, value){
            correlations[value["symbol"]] = math_util.compute_series_correlation(value["series"], b_data.norm_value_series);
          });
          var risk_series = json_data.position_risk_series;
          var portfolio_correlation = math_util.compute_series_correlation(json_data.norm_pnl_split[0], b_data.norm_value_series);
          var risk_table_data = namespace_portfolio_aux.compute_risk_decomposition_table(risk_series,json_data.derived_split, json_data.derived_risk, p_net_data,correlations,portfolio_correlation);
          render_risk_decomposition_table("#risk_decomposited", risk_table_data);
	 var risk_std = risk_table_data[risk_table_data.length-1][4];
        render_risk_and_return_tables(json_data.derived_split[0], risk_std);


        });
        var display_mode = "percent";
        var chart_mode = "val_chart";
        var flag_mode = false;
        var flags = [];
        var position_data = namespace_portfolio_aux.get_position_chart_data(p_data_positions,p_total_value);
        //namespace_graphs.render_val_pnl_chart(json_data.norm_value_series, "#chart_container_3", display_mode, flag_mode, chart_mode, flags);
        namespace_graphs.render_position_chart(position_data, "#chart_container_4", display_mode);
       }
    });
  }

  // get data for risk and return table
  // get data for risk breakdown table
  function render_risk_and_return_tables(p_client_report, p_risk_std)
  {
    var portfolio_final_value =math_util.aux_math_round(p_client_report.value_end,2)+"%";
    var portfolio_net_profit = math_util.aux_math_round(p_client_report.diff_percent,2)+"%";
    var portfolio_annualized = p_client_report.annualized+"%";
    var portfolio_std_vol = p_client_report.std_dev+"%";
    $("#portfolio_net_pnl").text(portfolio_net_profit);
    $("#portfolio_value").text("100%");
    $("#portfolio_final_pv").text(portfolio_final_value);
    $("#portfolio_annualized").text(portfolio_annualized);
    $("#portfolio_std").text(p_risk_std);
    var p1 = 0.95;
    var p_val = namespace_html.read_value_as_float($("#value_totals").text());
    var a2 = $("#portfolio_annualized").text();
    var b2 = $("#portfolio_std").text();
    var c2 = parseFloat(a2.substring(0,a2.length - 1));
    var d2 = parseFloat(b2.substring(0,b2.length - 1));
    var vatr2 = math_util.aux_math_round(namespace_xls.norminv(p1,c2,d2),2);
    var vatr3 = namespace_html.display_as_percentage(vatr2);
    //show_portfolio_selection$("#portfolio_vatr_pc").text(vatr3);
    saved_tables["performance_year"] = [
        ["Period", "Initial Value", "Final Value", "Net PnL", "Annual PnL", "Volatility"],
        ["3 Years", "100%", portfolio_final_value, portfolio_net_profit,portfolio_annualized,p_risk_std]
    ];
  }
  //create transactions
  //create position data from transactions
  //compute net_dat from position data
  function compute_portfolios()
  {
    var transaction_list = [];
    var net_cash = 100000;
    var portfolio_value_list = [];
    //today date
    var today = new Date();
    //convert to string
    var start_date = datetime_util.adjust_date(datetime_util.get_shifted_year_date(3)); //.(today);
    var portfolio_selected_data = p_data_extended["basic"][0];
    //start with 100k cash
    $.each(portfolio_selected_data, function(index, value){
        portfolio_value_list.push([value[0],value[1]/100 * net_cash]);
    });
    var counter = portfolio_value_list.length;
    var net_cash_value = 0;
    var cash_transaction = {
        volume: net_cash,
        book_date: start_date,
        type: "Deposit",
        asset: "Cash",
        sector: "-",
        book_price: 1.0,
        last_price: 1.0
    };
    transaction_list.push(cash_transaction);
    $.each(portfolio_value_list, function(index, value){
      $.getJSON(API_URL, {instrument:value[0], call:"quote", datetime:start_date}, function(data)
      {
          if (data.header.error_code == 0)
          {
            var book_price = data.contents.price;
            var book_volume = math_util.aux_math_round(value[1]/data.contents.price,0);
            var last_date = datetime_util.adjust_date(datetime_util.get_yesterday_date());
            $.getJSON(API_URL, {instrument:value[0], call:"quote", datetime:last_date}, function(data)
            {
              if (data.header.error_code == 0)
              {
                var last_price = data.contents.price;
                $.getJSON(API_URL, {instrument:value[0], call:"sector"}, function(data)
                {
                  if (data.header.error_code == 0)
                  {
                    //here be transaction
                    var sector_value = data.contents.sector_data;
                    var new_transaction = {
                      volume:book_volume,
                      book_date: start_date,
                      type: "Buy",
                      asset: value[0],
                      sector: sector_value,
                      book_price: book_price,
                      last_price: last_price,
                    };
                    net_cash_value = net_cash_value + new_transaction.volume*new_transaction.book_price;
                    transaction_list.push(new_transaction);
                    counter--;
                    if (counter<=0)
                    {
                      transaction_list[0].volume = net_cash_value;
                      //console.log(transaction_list);
                      var position_data = namespace_portfolio_aux.compute_position_data(transaction_list);
                      var net_data = namespace_portfolio_aux.compute_net_data(position_data);
                      render_charts(transaction_list, net_data)
            				//	render_tables(risk_table_data);
                    }
                  }
                });
              }
            });
          }
        });
    });
  }

  function compute_display_positions(p_data, p_container_id, p_selected)
  {
    //read net amount
    var start_amount = $("#money").val();
    //var positions_basic = p_data_extended["basic"];
    var positions_basic = p_data;
    var display_positions_basic = [];
    var display_start=datetime_util.adjust_date(new Date());
    display_positions_basic.push(["Cash","Deposit", start_amount, display_start, 1.0]);
    //create objects in the format
    //symbol, type, volume, date, price
    var counter = positions_basic.length;
    $.each(positions_basic, function(index, value)
    {
      $.getJSON(API_URL, {instrument:value[0], call:"quote", datetime:display_start}, function(data)
      {
        if (data.header.error_code == 0)
        {
          var last_quote = data.contents.price;
          var volume = value[1]/100 * start_amount / last_quote;
          display_positions_basic.push([
            value[0],
            "Buy",
            math_util.aux_math_round(volume-0.5,0),
            display_start,
            math_util.aux_math_round(last_quote,2)
          ]);
          counter--;
          if (counter<=0)
          {
            var rows = "";
            saved_tables["computed_positions"]=[];
            saved_tables["computed_positions"].push(["Symbol", "Action", "Volume", "Date", "Price"]);
            p_csv_positions[p_selected]=display_positions_basic;
            $.each(display_positions_basic, function(index, value){
              rows = rows + row_macro(value);
              saved_tables["computed_positions"].push(value);
            });
            $(p_container_id).empty();
            $(p_container_id).append(rows);
            //append as table
          }
        }
      });
    });
  }

  function get_portfolio_intro(score)
  {
    var intro_text ="";
    var intro_css="";
    if (score<16)
    {
      intro_text = "<h4>Conservative</h4>Your primary objective is preservation of the capital with minimal risk. You"
      +"can allow only short amount of time for portfolio to recover from negative period.";
      intro_css="btn-primary";
    }
    else if (score<24)
    {
      intro_text = "<h4>Income</h4>You are willing to tolerate some market fluctuations for the better returns";
      intro_css="btn-info";
    }
    else if ((score>=24)&&(score<=30))
    {
      intro_text = "<h4>Balanced</h4>You are willing to tolerate market fluctuations and more time for the market"
      + " to recover value. You have some  experience with investments and you understand"
      + "tradeoff between market risks and returns.";
      intro_css="btn-success";
    }
    else if (score>30)
    {
      intro_text = "<h4>Growth</h4>You are a knowledgeable investor and not concerned about short-term"
      +"fluctuations. You are willing to wait longer time to maximize your profits.";
      intro_css="btn-warning";
    }
    return {"text":intro_text, "css":intro_css};
  }

  return {
    init_page_state: function()
    {
      //page init actions
      namespace_graphs.init_chart_style();
      $("#show_performance").hide();
      $("#table_1").hide();
      $("#table_2").hide();
      $("#table_3").hide();
      $("#table_31").hide();
      $("#table_4").hide();
      $("#table_5").hide();
      $("#table_7").hide();
      $("#table_8").hide();
      $("#header_1").hide();
      $("#header_3").hide();
      $("#header_4").hide();
      $("#header_5").hide();
      $("#header_6").hide();
      $("#basic_positions").hide();
      $("#get_pdf_report").hide();
      $("#get_positions_as_csv").hide();
      $("#net_values_risk").hide();
      $("#header_2").hide();
      $("#net_values_report").hide();
      $("#export_results").hide();
      $("#frame_1").hide();
      $("#frame_2").hide();
      $("#frame_3").hide();
      $("#frame_4").hide();
      $("#intro_slides").hide();
    },

    get_profile: function()
    {
      var scores ={
        "Conservative" : 8,
        "Income" : 16,
        "Growth": 24,
        "Risk taker" : 32
      };

      var net_value = 0;
      var investor_mode =$("#investor_mode :selected").text();
      var investor_age = parseInt($("#investor_age").val());
      var investor_amount =  parseInt($("#investor_amount").val());
      //console.log(net_value);
      $("#portfolios_list").show();
      /* var p_obj = compute_profile_score(net_value);
      var template='<table class="table table-bordered">'+
      '<tr><th style="display:none">Score</th><td style="font-size:23px">Your&nbsp;Investment&nbsp;Type</td>'+
      '</td><td style="font-size:24px">' + p_obj["title"] + '</td></tr>'+
      '<tr><td id="p_score" style="display:none;">'+ p_obj["score"] +'</td><td style="font-size:24px">Notes</td>'
        +'<td style="font-size:24px">'
        + p_obj["Description"]
        + '</td></tr></td></tr></table>'
        +'<button class="btn btn-default" onclick="namespace_iplanner.show_portfolio_selection()">Show Investment Plan</button>';
      $("#investor_type").empty();
      $("#investor_type").append(template); */
    },

    show_portfolio_selection: function(p_score)
    {
      var score = p_score;
      var p_data = compute_portfolio_data(score);
      var p_text = get_portfolio_intro(score);
      var simple_title = "<h4><b>Recommended allocation</b><br/><em>Equity "
        + p_data["basic"][0]['y'] + "%, Fixed Income "+p_data["basic"][1]['y']+"%</em></h4>";
      var complex_title = "<h4><b>Detailed distribution</b><br/><br/></h4>";
    //  var chart_data = compute_chart_series(p_data);
      //$("#header_1").append(simple_title)
      var charts_simple = create_charts_pie(p_data["basic"], null);
      $("#chart_title_1").html(simple_title);
      $("#chart_title_2").html(complex_title);
      var chart_data_advanced = create_detailed_series(score);
      var charts_advanced = create_charts_bar(chart_data_advanced["basic"][1], null);
      $("#chart_container_1").highcharts('Chart', charts_simple[0]);
      $("#chart_container_12").highcharts('Chart', charts_advanced[0]);
      //append tables simple
      $("#table_1").empty();
      $("#intro_text").empty();
      $("#intro_text").append(p_text["text"]);
      $("#intro_text").removeClass();
      $("#intro_text").addClass('paragraph_hilite');
      $("#intro_text").addClass(p_text["css"]);
      append_tables_advanced(chart_data_advanced["basic"][0]);
      //p_data["basic"][0][1]
  /*    $("#table_1").append(
        '<tr><td><b>Basic portfolio distribution: </b></td>' +
        '<td><b>Equity: <b>' + p_data["basic"][1][1] + '%</td>' +
        '<td><b>Fixed Income: </b>' +p_data["basic"][2][1]+'%</td></tr>'
      ); */
      //set visibilty
      $("#intro_label").hide();
      $("#show_performance").show();
      $("#table_1").show();
      $("#table_2").show();
      $("#table_3").show();
      $("#table_31").show();
      $("#table_4").show();
      $("#table_7").show();
      $("#table_8").show();
      $("#header_3").show();
      $("#header_4").show();
      $("#header_5").show();
      $("#header_6").show();
    //  $("#basic_positions").show();
      $("#get_pdf_report").show();
      $("#get_positions_as_csv").show();
      $("#frame_1").show();
      $("#frame_2").show();
      $("#frame_3").show();
      $("#frame_4").show();
      $('a[href=#Tab2]').tab('show');
      this.show_performance_view();
    },

    show_portfolio_summary: function()
    {
      $('a[href=#Tab1]').tab('show');
    },

    show_performance_view: function()
    {
      compute_portfolios();
      $("#table_5").show();
      $("#header_1").show();
      $("#net_values_risk").show();
      $("#header_2").show();
      $("#net_values_report").show();
      $("#export_results").show();
      //$('a[href=#Tab3]').tab('show');
      this.show_export_view();
    },

    get_csv_file: function()
    {
  /*    if ($("input[name='positions_csv']").val()=="advanced")
      {
        var p_data=p_csv_positions["plus"];
      }
      else if ($("input[name='positions_csv']").val()=="basic")
      {
      } */
      var p_data=p_csv_positions["basic"];
      var data=JSON.stringify(p_data);
      var input = $("<input>").attr("type", "hidden").attr("name", "data").val(data);
      $('#get_positions_as_csv').append($(input));
    },

    show_export_view: function()
    {
    //  compute_display_positions(p_data_extended["basic"][0],"#basic_positions_body","basic");
      //$('a[href=#Tab4]').tab('show');
    },

    recalculate_exportable_positions: function()
    {
    //  compute_display_positions(p_data_extended["basic"][0],"#basic_positions_body","basic");
    },

    update_portfolio_view: function()
    {
      compute_portfolios();
    },

    return_report_data :function ()
    {
      //$('#get_pdf_report').empty();
      var p_data = [];
      var summary_obj = [["Net Value", "Net PnL"],[100000, 1000]];
      var allocation_chart_object = JSON.stringify(saved_charts["allocation_chart"]);
      var performance_chart_ojbect = JSON.stringify(namespace_graphs.return_performance_chart_object());
      var detailed_allocations = JSON.stringify(saved_charts["detailed_allocations"]);
      var positions_chart_object = JSON.stringify(namespace_graphs.return_position_chart_object());
      p_data.push({"type":"chart","contents": allocation_chart_object, "header":"Allocation Summary"});
      p_data.push({"type":"table","contents": saved_tables["positions_fixed"], "header":"Positions - Fixed Income"});
      p_data.push({"type":"table","contents": saved_tables["positions_equity"], "header":"Positions - Equity"});
      p_data.push({"type":"table","contents": saved_tables["performance_year"], "header":"Portfolio Performance"});
      p_data.push({"type":"chart","contents": detailed_allocations, "header":"Detailed Positions"});
      p_data.push({"type":"chart","contents": performance_chart_ojbect, "header":"Historical Perfomance"});
      p_data.push({"type":"chart","contents": positions_chart_object, "header":"Positions Performance"});
      p_data.push({"type":"table","contents": saved_tables["risk_table"], "header":"Portfolio Risk and Returns"});
  //    p_data.push({"type":"table","contents": saved_tables["computed_positions"], "header":"Your Positions"});
      //compute positions
      //convert to list of pdf blocks
      //send data to server
      var data=JSON.stringify(p_data);
      var input = $("<input>").attr("type", "hidden").attr("name", "data").val(data);
      $('#get_pdf_report').append($(input));
    }
  }
}) ();
