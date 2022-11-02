const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const Role = require('./model/Role');
const User = require('./model/User');
const { secret } = require('./config');

const generateAccessToken = (id, roles) => {
	const payload = {
		id,
		roles
	}
	return jwt.sign(payload, secret, { expiresIn: "24h" })
}

class authControler {
	async registration(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(200).json({ message: "Ошибка при регистрации", errors })
		}
		try {
			const { username, password } = req.body;
			const candidate = await User.findOne({ username });
			if (candidate) {
				return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
			}
			const hashPassword = bcrypt.hashSync(password, 7);
			const userRole = await Role.findOne({ value: "USER" })
			const user = await User({ username, password: hashPassword, roles: [userRole.value] });
			user.save();
			return res.json({ message: "Пользователь успешно зарегистрирован" })

		} catch (e) {
			console.log(e);
			res.status(400).json({ message: 'Registration error' })
		}

	}

	async login(req, res) {
		try {
			const { username, password } = req.body;
			const user = await User.findOne({ username });
			if (!user) {
				return res.status(400).json({ message: `Пользователь ${username} не найден` });
			}
			const validPassword = bcrypt.compareSync(password, user.password);
			if (!validPassword) {
				res.status(200).json({ message: `Введен неверный пароль` });
			}

			const token = generateAccessToken(user._id, user.roles);
			return res.json({ token })


		} catch (e) {
			console.log(e);
			res.status(400).json({ message: 'Login error' })
		}

	}

	async getUsers(req, res) {
		try {
			const users = await User.find();
			res.json(users);

		} catch (e) {
			console.log(e);
		}

	}
}

module.exports = new authControler();