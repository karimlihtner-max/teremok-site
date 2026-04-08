<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Детский сад ТЕРЕМОК</title>
                <link rel="stylesheet" href="styles.css"/>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1><xsl:value-of select="детский_сад/название"/></h1>
                        <div class="contact-info">
                            <p><strong>Адрес:</strong> <xsl:value-of select="детский_сад/адрес"/></p>
                            <p><strong>Телефон:</strong> <xsl:value-of select="детский_сад/телефон"/></p>
                            <p><strong>Email:</strong> <xsl:value-of select="детский_сад/email"/></p>
                        </div>
                        <p class="description"><xsl:value-of select="детский_сад/описание"/></p>
                    </header>
                    
                    <nav class="tabs">
                        <button class="tab-button active" onclick="showSection('groups')">Группы</button>
                        <button class="tab-button" onclick="showSection('schedule')">Расписание</button>
                        <button class="tab-button" onclick="showSection('events')">Мероприятия</button>
                    </nav>
                    
                    <section id="groups" class="content-section active">
                        <h2>Группы детского сада</h2>
                        <xsl:for-each select="детский_сад/группы/группа">
                            <div class="group-card">
                                <h3><xsl:value-of select="название"/></h3>
                                <div class="group-info">
                                    <p><strong>Возраст:</strong> <xsl:value-of select="возраст"/></p>
                                    <p><strong>Воспитатель:</strong> <xsl:value-of select="воспитатель"/></p>
                                    <p><strong>Количество детей:</strong> <xsl:value-of select="количество_детей"/></p>
                                </div>
                                <div class="children-list">
                                    <h4>Дети в группе:</h4>
                                    <ul>
                                        <xsl:for-each select="дети/ребенок">
                                            <li>
                                                <strong><xsl:value-of select="имя"/> <xsl:value-of select="фамилия"/></strong>
                                                <span class="age">(<xsl:value-of select="возраст"/> лет)</span>
                                                <div class="parent-info">
                                                    Родитель: <xsl:value-of select="родитель"/><br/>
                                                    Телефон: <xsl:value-of select="телефон"/>
                                                </div>
                                            </li>
                                        </xsl:for-each>
                                    </ul>
                                </div>
                            </div>
                        </xsl:for-each>
                    </section>
                    
                    <section id="schedule" class="content-section">
                        <h2>Расписание дня</h2>
                        <div class="schedule-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Время</th>
                                        <th>Активность</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <xsl:for-each select="детский_сад/расписание/день">
                                        <tr>
                                            <td class="time-cell"><xsl:value-of select="время"/></td>
                                            <td><xsl:value-of select="активность"/></td>
                                        </tr>
                                    </xsl:for-each>
                                </tbody>
                            </table>
                        </div>
                    </section>
                    
                    <section id="events" class="content-section">
                        <h2>Предстоящие мероприятия</h2>
                        <div class="events-list">
                            <xsl:for-each select="детский_сад/мероприятия/мероприятие">
                                <div class="event-card">
                                    <h3><xsl:value-of select="название"/></h3>
                                    <p class="event-date"><strong>Дата:</strong> <xsl:value-of select="дата"/></p>
                                    <p class="event-description"><xsl:value-of select="описание"/></p>
                                </div>
                            </xsl:for-each>
                        </div>
                    </section>
                </div>
                
                <footer>
                    <p>&copy; 2024 Детский сад "ТЕРЕМОК". Все права защищены.</p>
                </footer>
                
                <script src="script.js"></script>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>


