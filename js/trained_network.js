function TrainedNetwork(){}TrainedNetwork.net=function(r){for(var e=window.netData,n=1;n<e.layers.length;n++){var t=e.layers[n],a={};for(var i in t){var o=t[i],w=o.bias;for(var f in o.weights)w+=o.weights[f]*r[f];a[i]=1/(1+Math.exp(-w))}r=a}return a},TrainedNetwork.getMax=function(r){let e=[];for(let n in r)e.push(r[n]);const n=Math.max(...e);return e.indexOf(n)},TrainedNetwork.analize=function(r){var e=TrainedNetwork.net(r);return TrainedNetwork.getMax(e)};