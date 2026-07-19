sed -i "s/request.auth.token.email == 'yoafyosf121@gmail.com'/('email' in request.auth.token \&\& request.auth.token.email == 'yoafyosf121@gmail.com')/g" firestore.rules
