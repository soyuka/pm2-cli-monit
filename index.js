var progress = require('ascii-progress')
var prettyBytes = require('pretty-bytes')

let max = 1.76e9

var bar = new progress({
  schema: '[:bar] :cBytes / :tBytes',
  total: max,
  current: 0
})

let pro = 100000000
setInterval(() => {
  pro += 100000000
  bar.current = pro
  bar.tick({cBytes: prettyBytes(pro), tBytes: prettyBytes(max)})
}, 1000)


