var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        passwordHash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function(value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('passwordHash', hashedPassword);
            }
        }
    }, {
        hooks: {
            beforeValidate: function(user, options) {
                if (typeof user.email === 'string') {
                    user.email = user.email.toLowerCase();
                }
            }
        },
        classMethods: {
            authenticate: function (body) {
                return new Promise(function(resolve, reject) {
                    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
                        return reject();
                    }

                    user.findOne({
                        where: {
                            email: body.email
                        }
                    }).then(function(data) {
                        if (!data || !bcrypt.compareSync(body.password, data.get('passwordHash'))) {
                            return reject();
                        }

                        resolve(data);
                    }, function() {
                        reject();
                    });
                });
            },
            findByToken: function(token) {
                return new Promise(function(resolve, reject) {
                    try {
                        var decodedJWT = jwt.verify(token, 'qwerty123');
                        var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#');
                        var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

                        user.findById(tokenData.id).then(function(user) {
                            if (user) {
                                resolve(user);
                            } else {
                                reject();
                            }
                        }, function(err) {
                            reject();
                        });
                    } catch (err) {
                        reject();
                    }
                });
            }
        },
        instanceMethods: {
            toPublicJSON: function () {
                var json = this.toJSON();
                return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
            },
            generateToken: function (type) {
                if (!_.isString(type)) {
                    return undefined;
                }

                try {
                    var stringData = JSON.stringify({
                        id: this.get('id'),
                        type: type
                    });
                    var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#').toString();
                    var token = jwt.sign({
                        token: encryptedData
                    }, 'qwerty123');

                    return token;
                } catch (err) {
                    console.error(err);
                    return undefined;
                }
            }
        }
    });

    return user;
};