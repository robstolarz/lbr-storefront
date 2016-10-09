var path = require('path');
module.exports = (function(pgArgs){
	var dbcache;
	function getDB(){
		// set up database
		var pgp = require('pg-promise')({
			// TODO: pg-native ?
		});

		var db = pgp(pgArgs || { // TODO: fork lib to use psql-type defaults
			host: process.env.PGHOST,
			database: process.env.PGDATABASE,
			user: process.env.PGUSER,
			password: process.env.PGPASSWORD
		});
		return db.query('SELECT EXISTS ( SELECT 1 FROM information_schema.tables WHERE table_name = \'session\' )').then(function(data){
			var sessionTableExists = data[0].exists;
			if(!sessionTableExists){
				console.log("Session table didn't exist. Creating one now...");
				var thePath = path.join(path.parse(require.resolve('connect-pg-simple')).dir,'table.sql');
				return db.any(new pgp.QueryFile(thePath));
			}
		}).then(Promise.resolve(db));
	}

	return {
		getDB: () => dbcache || (dbcache = getDB())
	}
});
