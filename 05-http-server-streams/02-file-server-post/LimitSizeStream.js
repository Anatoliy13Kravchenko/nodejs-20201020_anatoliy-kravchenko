const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    const customOptions = Object.assign({}, {
      encoding: 'utf8',
      ...options,
    });
    super(customOptions);

    this.limit = options.limit;
    this.size = 0;
    this.isObjectMode = !!options.readableObjectMode;
  }

  _transform(chunk, encoding, callback) {
    if (this.isObjectMode) {
      this.size += 1;
    } else {
      this.size += chunk.length;
    }

    if (this.size > this.limit) {
      callback(new LimitExceededError());
    } else {
      callback(null, chunk);
    }
  }
}

module.exports = LimitSizeStream;
