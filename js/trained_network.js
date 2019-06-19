function TrainedNetwork() {};

TrainedNetwork.net = function(input) {
    var netData = window["netData"]
    for (var i = 1; i < netData.layers.length; i++) {
      var layer = netData.layers[i];
      var output = {};
  
      for (var id in layer) {
        var node = layer[id];
        var sum = node.bias;
  
        for (var iid in node.weights) {
          sum += node.weights[iid] * input[iid];
        }
        output[id] = 1 / (1 + Math.exp(-sum));
      }
      input = output;
    }
    return output;
}

TrainedNetwork.getMax = function(output) {
    let array = []
    for (let i in output) {
        array.push(output[i])
    }
    const max = Math.max(...array);
    return array.indexOf(max);
}
  
TrainedNetwork.analize = function(input) {
    var output = TrainedNetwork.net(input);
    return TrainedNetwork.getMax(output);
}