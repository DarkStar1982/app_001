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
      namespace_basic.compute_score(net_value);
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
