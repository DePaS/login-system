
function test() {
	console.log('test')
}

module.exports = test

/*function timedMail() {
                                    con.query("UPDATE login SET Dfa_token_time = CURRENT_TIMESTAMP WHERE email = ?", [email], function(err, result2) {
                                        if (err) throw err 
                                        const mailOptions = {
                                            from: 'helpdesk-appagri@hotmail.com',
                                            to: email,
                                            subject: 'rimozione 2fa',
                                            html: '<p>clicka sul link di seguito per rimuovere il 2fa \n</p>' + 
                                            '\n \n<a href="http://localhost:8080/doublefa?key=' + result[0].Dfa_token + '">click</a>'
                                        }
                                        transporter.sendMail(mailOptions, function (err, info) {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log('Sent: ' + info.response);
                                                success = "mail inviata per la rimozione dell'autenticatore a due fattori"
                                                res.render('welcome.ejs', {success: success})
                                            }
                                        });
                                    })
                                }
*/