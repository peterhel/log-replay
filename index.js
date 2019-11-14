const fs = require('fs');
const readline = require('readline');
const url = require('url');

let previousTimestamp = null;

let requestQueue = [];

async function processLine(line) {
    let [arg0, requestInfo, arg1, userAgent] = line.split(/"(.+?)"/);
    let [, timestamp] = arg0.split(' ');
    let [method, url] = requestInfo.split(' ');

    url = url.replace('http:', 'https:');
    url = url.replace(':80', '');

    let date = new Date(timestamp);

    if(previousTimestamp === null) {
    	previousTimestamp = date;
    }

    let waitMillis = date - previousTimestamp;
	
    if(waitMillis < 0) {
    	waitMillis = waitMillis * -2 + waitMillis;
    }

    let request = {
    	timestamp,
    	waitMillis,
    	method,
    	url,
    	userAgent
    };

	previousTimestamp = date;

	// Ignore POST since it requires more work, and probably auth.
    if(method !== 'GET') {
    	return;
    }

    requestQueue.push(request);
}

function executeNext(requestEntity) {
	if(!requestEntity) {
		return;
	}

	process.nextTick(() => {
		console.log(requestEntity);
	});

	next = requestQueue.shift();

	setTimeout(() => {
		executeNext(next);
	}, next.waitMillis);
}

async function main() {
  const fileStream = fs.createReadStream('068247634321_elasticloadbalancing_eu-west-1_app.bongobongo-prod-alb.9effae0397affa29_20191109T1200Z_34.252.135.56_3weajyzf.log');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    await processLine(line);
  }

	next = requestQueue.shift();

	setTimeout(() => {
		executeNext(next);
	}, next.waitMillis);
}

main();
