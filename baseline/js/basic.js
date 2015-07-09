$(document).ready(function(){
  $("#get_score").on('click', function(e){
      var net_value = 0;
      net_value =  parseInt($("#age").val())
        + parseInt($("#net_assets").val())
        + parseInt($("#knowledge").val())
        + parseInt($("#duration").val())
        + parseInt($("#goal").val())
        + parseInt($("#max_drop").val())
        + parseInt($("#recover").val())
        + parseInt($("#profit_or_loss").val());
      namespace_basic.display_score(net_value);
    });
});

var namespace_basic = (function(e) {

  function map_to_html(score, p_obj)
  {
    var template='<table class="table table-bordered">'+
    '<tr><th>Score</th><th>Your&nbsp;Investment&nbsp;Profile</th><th>Notes</th><th>Actions</th></tr>'+
    '<tr><td>'
      + score + '</td><td>' + p_obj["title"] + '</td><td>'
      + p_obj["Description"]
      + '</td><td><button class="btn btn-default">Show Investment Plans</button></td></tr></table>';
    $("#investor_type").empty();
    $("#investor_type").append(template);
  }

  return {
    //Compute portfolio performance
    display_score: function(p_rank_value)
    {
      var investor_profile = {};
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
      else if (p_rank_value>24)
      {
        //growth
        investor_profile["title"] = "Growth&nbsp;Investor";
        investor_profile["Description"] = "You are willing to tolerate market fluctuations and more time for the market to recover value."
          + "You have some experience with investments and you understand tradeoff betwee market risks and returns.";
      }
      else if (p_rank_value>30)
      {
        //aggressive growth
        investor_profile["title"] = "Aggressive&nbsp;Growth&nbsp;Investor";
        investor_profile["Description"] = "You are a knowledgeable investor and not concerned about short-term fluctuations"
          + "You are willing to wait longer time to maximize your profits.";
      }
      map_to_html(p_rank_value, investor_profile);
    }
  }
}) ();
