$(document).ready(function(){
  $("#get_score").on('click', function(e){
      var values = {
        "age": $("input:radio[name=age]:checked").val(),
        "net_worth": $("input:radio[name=net_worth]:checked").val(),
        "contrib_rank" : $("input:radio[name=contrib]:checked").val(),
        "investor_rank" : $("input:radio[name=know]:checked").val(),
        "investment_duration" : $("input:radio[name=duration]:checked").val(),
        "goal_rank" : $("input:radio[name=goal_rank]:checked").val(),
        "risk_rank" : $("input:radio[name=risk_rank]:checked").val(),
        "recover_duration" : $("input:radio[name=recover_duration]:checked").val(),
        "loss_or_profit" : $("input:radio[name=loss_or_profit]:checked").val()
      }
      namespace_basic.compute_score(values);
    });
});

var namespace_basic = (function(e) {
  return {
    //Compute portfolio performance
    compute_score: function(p_rank_values)
    {
        console.log(p_rank_values);
    }
  }
}) ();
