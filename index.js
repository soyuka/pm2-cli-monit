const progress = require('ascii-progress')
const prettyBytes = require('pretty-bytes')
const pm2 = require('pm2')

let max = 1.76e9
const bars = {}
let lengthMemory = 0

function reset() {
  process.stdout.write('\x1Bc')
}

function showBars(list) {
  if (list.length < lengthMemory) {
    for (let i in bars) {
      ;['cpu', 'memory'].forEach((e) => bars[i][e].clear())
      delete bars[i]
    }

		reset()
  }

  lengthMemory = list.length
  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    let key = item.name + '-' + item.pm_id
    let bar = bars[key]

    if (bar === undefined) {
      bar = bars[key] = {
        memory: new progress({
          schema: `:name \nMemory: .white[:bar.magenta] :cBytes / ${prettyBytes(max)}`,
          total: max
        }),
        cpu: new progress({
          schema: `CPU:    .white[:bar.magenta] :percent\n`,
          total: 100
        })
      }
    }

    let status = null
    switch(item.pm2_env.status) {
      case 'online':
        status = 'online.green.bold'
        break;
      case 'stopped':
        status = 'stopped.yellow.bold'
        break;
      case 'errored':
        status = 'errored.red.bold'
        break;
      default:
        status = item.pm2_env.status+'.white.bold'
    }

    bar.memory.current = item.monit.memory
    bar.memory.tick({
      cBytes: prettyBytes(item.monit.memory),
      name: `${item.name}.bold.underline - .white${item.pid}.bold (.white${status}).white`
    })
    bar.cpu.current = item.monit.cpu
    bar.cpu.tick()
  }
}

function error(err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
}

pm2.connect(function(err) {
  error(err)
  reset()

  pm2.launchBus(function(err, bus) {
    error(err)
    bus.on('pm2:kill', function() {
      console.error('PM2 is beeing killed')
      process.exit(1)
    })
  })

  setInterval(() => {
    pm2.list(function(err, list) {
      showBars(list)
    })
  }, 1000)
})
